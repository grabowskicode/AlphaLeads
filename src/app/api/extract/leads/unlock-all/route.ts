// src/app/api/extract/leads/unlock-all/route.ts
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const { leadIds } = await req.json();
    const cost = leadIds?.length || 0;

    if (cost === 0) return NextResponse.json({ success: true });

    // 1. Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

    // 2. Read the Cache: Fetch leads to see which ones are missing emails
    const { data: leadsData } = await supabase
      .from("leads")
      .select("id, website, email, phone")
      .in("id", leadIds);

    if (!leadsData) throw new Error("Leads not found");

    // 3. Atomic Deduction
    const { error: rpcError } = await supabase.rpc("decrement_credits", {
      p_user_id: userId,
      p_amount: cost,
    });

    if (rpcError) {
      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 },
      );
    }

    // 4. THE ENRICHMENT ENGINE
    // Only target leads that have a website but are missing an email in our database
    const leadsToEnrich = leadsData.filter((l) => !l.email && l.website);

    if (leadsToEnrich.length > 0) {
      // Outscraper allows batching domains by separating them with a comma
      const queries = leadsToEnrich.map((l) => l.website).join(",");
      const apiUrl = `https://api.app.outscraper.com/contacts/search-v2?query=${encodeURIComponent(queries)}&async=false`;

      const response = await fetch(apiUrl, {
        headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
      });
      const outscraperData = await response.json();

      // Parse the Outscraper payload and update the Supabase Cache
      if (outscraperData.data && Array.isArray(outscraperData.data)) {
        for (let i = 0; i < leadsToEnrich.length; i++) {
          const lead = leadsToEnrich[i];
          const resultGroup = outscraperData.data[i];

          if (resultGroup && resultGroup.length > 0) {
            const contactInfo = resultGroup[0];
            const newEmail = contactInfo.emails?.[0]?.value || null;
            const newPhone = contactInfo.phones?.[0]?.value || null;

            if (newEmail || newPhone) {
              await supabase
                .from("leads")
                .update({
                  email: newEmail,
                  phone: newPhone,
                })
                .eq("id", lead.id);
            }
          }
        }
      }
    }

    // 5. Unlock the Leads for the user
    const unlockEntries = leadIds.map((id: string) => ({
      user_id: userId,
      lead_id: id,
      is_unlocked: true,
    }));

    const { error: unlockError } = await supabase
      .from("user_leads")
      .upsert(unlockEntries, { onConflict: "user_id, lead_id" });

    // 6. The Refund Safety Net
    if (unlockError) {
      await supabase.rpc("increment_credits", {
        p_user_id: userId,
        p_amount: cost,
      });
      throw new Error("Database failed to unlock leads. Credits refunded.");
    }

    return NextResponse.json({ success: true, count: cost });
  } catch (error: any) {
    console.error("Unlock Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
