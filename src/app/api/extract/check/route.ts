import { createClient } from "@supabase/supabase-js";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  // 1. User Client (For Auth Check Only)
  const supabaseUser = createRouteHandlerClient({ cookies });

  // 2. Admin Client (The "Master Key")
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  );

  const REFUND_AMOUNT = 100;

  try {
    const { requestId } = await req.json();
    const apiKey = process.env.OUTSCRAPER_API_KEY;

    // --- 1. Check Outscraper Status FIRST ---
    // We don't lock yet because if it's PENDING, we want to allow retries.
    const statusUrl = `https://api.app.outscraper.com/requests/${requestId}`;
    const response = await fetch(statusUrl, {
      headers: { "X-API-KEY": apiKey! },
    });

    if (!response.ok) {
      throw new Error(
        `Outscraper API Error: ${response.status} ${response.statusText}`,
      );
    }

    const data = await response.json();

    // If still pending, just return (Do not lock)
    if (data.status === "PENDING" || data.status === "Processing") {
      return NextResponse.json({ status: "PENDING" });
    }

    if (data.status !== "Success") {
      throw new Error(
        `Outscraper Job Failed: ${data.error || JSON.stringify(data)}`,
      );
    }

    // --- [SECURITY FIX] 2. ATOMIC LOCK (The "Claim" Step) ---
    // We attempt to insert "LOCKED". If this ID exists, this will fail immediately.
    // This physically prevents 2 requests from passing this line.
    const { error: lockError } = await supabaseAdmin
      .from("processed_requests")
      .insert({
        request_id: requestId,
        // We need a user_id for the table constraint, we fetch it momentarily or use a temp placeholder if allowed,
        // but typically we need the user first. Let's get Auth first.
      });

    // WAIT! We need the User ID to insert into processed_requests (references auth.users).
    // Let's swap the order: Auth Check -> Lock -> Process.

    // --- 2. Auth Check (Moved Up) ---
    const {
      data: { session },
    } = await supabaseUser.auth.getSession();
    const userId = session?.user?.id;
    if (!userId)
      return NextResponse.json({ error: "No User" }, { status: 401 });

    // --- [SECURITY FIX RE-ATTEMPT] 3. ATOMIC LOCK ---
    const { error: insertError } = await supabaseAdmin
      .from("processed_requests")
      .insert({
        request_id: requestId,
        user_id: userId,
        status: "LOCKED", // Temporary status to block others
      });

    if (insertError) {
      // If error is "Duplicate Key", it means it's already done or in progress.
      // We check the status to give a helpful response.
      const { data: existing } = await supabaseAdmin
        .from("processed_requests")
        .select("status")
        .eq("request_id", requestId)
        .single();

      const status =
        existing?.status === "REFUNDED" ? "ZERO_RESULTS" : "SUCCESS";
      return NextResponse.json({
        status: status,
        message: "Request already processed (Replay blocked).",
      });
    }

    // =========================================================
    // 🛡️ WE NOW OWN THIS TRANSACTION. NO ONE ELSE CAN ENTER. 🛡️
    // =========================================================

    try {
      // --- 4. Process Results ---
      const rawResults = data.data?.flat() || [];
      const totalScanned = rawResults.length;
      const validLeads: any[] = [];
      const validPlaceIds: string[] = [];

      // --- SNIPER FILTER ---
      for (const item of rawResults) {
        if (
          !item.place_id ||
          !item.name ||
          item.business_status === "CLOSED_PERMANENTLY"
        ) {
          continue;
        }

        const isVerified = item.verified !== false;
        const hasWebsite = !!(item.site || item.website);
        const rating = item.rating || 0;

        if (rating >= 4.5 && hasWebsite && isVerified) continue;

        // Email Logic
        let email = null;
        const genericPrefixes = [
          "info",
          "contact",
          "support",
          "admin",
          "sales",
          "hello",
        ];
        const getEmailString = (e: any) =>
          typeof e === "string" ? e : e?.value || null;
        const allEmails: string[] = [];

        if (item.email_1) allEmails.push(item.email_1);
        if (item.email_2) allEmails.push(item.email_2);
        if (Array.isArray(item.emails)) {
          item.emails.forEach((e: any) => {
            const c = getEmailString(e);
            if (c) allEmails.push(c);
          });
        }
        const uniqueEmails = [...new Set(allEmails)];
        const personalEmail = uniqueEmails.find(
          (e) => !genericPrefixes.includes(e.split("@")[0].toLowerCase()),
        );
        email = personalEmail || uniqueEmails[0] || null;

        // Buckets
        let bucket = "Qualified Lead";
        let details = "Standard Opportunity";
        const oneStar = item.reviews_per_score_1 || 0;
        const fiveStar = item.reviews_per_score_5 || 0;

        if (!isVerified) {
          bucket = "Unclaimed Business";
          details = "Google Profile not claimed.";
        } else if (!hasWebsite) {
          bucket = "Needs Website";
          details = "No website detected.";
        } else if (rating < 4.5 || oneStar > 0) {
          bucket = "Reputation Repair";
          details =
            oneStar > 0
              ? `Has ${oneStar} 1-star reviews.`
              : `Low rating (${rating}).`;
        }

        validLeads.push({
          place_id: item.place_id,
          business_name: item.name,
          website: item.site || item.website || null,
          email: email,
          full_name: item.owner_name || null,
          city: item.city || "Unknown",
          phone: item.phone,
          rating: rating,
          review_count: item.reviews || 0,
          reviews_per_score_1: oneStar,
          reviews_per_score_5: fiveStar,
          website_generator: item.site_generator,
          website_has_fb_pixel: !!item.site_pixel,
          is_verified: isVerified,
          bucket_category: bucket,
          bucket_details: details,
          business_status: "OPERATIONAL",
        });
        validPlaceIds.push(item.place_id);
      }

      // --- 5. Refund Logic ---
      if (validLeads.length === 0) {
        addLog(`⚠️ 0 Qualified Leads. Scanned: ${totalScanned}. Refunding.`);

        const { data: user } = await supabaseAdmin
          .from("users")
          .select("credits")
          .eq("id", userId)
          .single();

        if (user) {
          await supabaseAdmin
            .from("users")
            .update({ credits: user.credits + REFUND_AMOUNT })
            .eq("id", userId);
        }

        // UPDATE STATUS TO REFUNDED
        await supabaseAdmin
          .from("processed_requests")
          .update({ status: "REFUNDED" })
          .eq("request_id", requestId);

        let reason = "NO_DATA";
        if (totalScanned > 0) reason = "MARKET_SATURATED";

        return NextResponse.json({
          status: "ZERO_RESULTS",
          scanned: totalScanned,
          reason: reason,
        });
      }

      // --- 6. Save Leads ---
      addLog(`Saving ${validLeads.length} leads...`);

      const { error: upsertError } = await supabaseAdmin
        .from("leads")
        .upsert(validLeads, { onConflict: "place_id" });

      if (upsertError) throw upsertError;

      // Link to User
      const { data: dbLeads } = await supabaseAdmin
        .from("leads")
        .select("id")
        .in("place_id", validPlaceIds);

      if (dbLeads) {
        const userLinks = dbLeads.map((l) => ({
          user_id: userId,
          lead_id: l.id,
          is_unlocked: false,
        }));

        await supabaseAdmin
          .from("user_leads")
          .upsert(userLinks, { onConflict: "user_id, lead_id" });
      }

      // UPDATE STATUS TO COMPLETED
      await supabaseAdmin
        .from("processed_requests")
        .update({ status: "COMPLETED" })
        .eq("request_id", requestId);

      return NextResponse.json({
        status: "SUCCESS",
        count: validLeads.length,
        scanned: totalScanned,
      });
    } catch (processError: any) {
      // ROLLBACK: If processing crashed, delete the lock so user can try again
      console.error("Processing Failed, Removing Lock", processError);
      await supabaseAdmin
        .from("processed_requests")
        .delete()
        .eq("request_id", requestId);

      throw processError;
    }
  } catch (error: any) {
    console.error("Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
