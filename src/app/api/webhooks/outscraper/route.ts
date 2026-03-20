import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);

    const token = searchParams.get("token");
    if (token !== process.env.WEBHOOK_SECRET) {
      // 🚨 THE X-RAY LOG 🚨
      console.error(`AUTH FAIL -> Received: [${token}] | Expected: [${process.env.WEBHOOK_SECRET}]`);
      return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
    }

    const userId = searchParams.get("userId");
    const keyword = searchParams.get("keyword") || "Unknown";

    const body = await req.json();
    let allLeads: any[] = [];

    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((queryGroup: any) => {
        if (Array.isArray(queryGroup)) {
          allLeads = allLeads.concat(queryGroup);
        }
      });
    }

    const badBusinesses = allLeads.filter((lead: any) => {
      const hasWebsite = lead.website && lead.website.trim() !== "";
      const hasGoodRating = lead.rating && lead.rating > 4.0;
      return !hasWebsite || !hasGoodRating;
    });

    if (badBusinesses.length === 0) {
      if (userId) {
        await supabaseAdmin.rpc("refund_scan", { p_user_id: userId });
      }
      return NextResponse.json({ success: true, message: "No actionable businesses found. Scan refunded." });
    }

    const formattedLeads = badBusinesses.map((lead: any) => ({
      place_id: lead.place_id,
      business_name: lead.name,
      city: lead.city || lead.location_city,
      zip_code: lead.postal_code,
      keyword: keyword,
      rating: lead.rating || 0,
      review_count: lead.reviews || 0,
      website: lead.website || null,
      phone: lead.phone || null,
      bucket_category: lead.website ? "Bad Reviews" : "Needs Website",
      bucket_details: `Rating: ${lead.rating || 0}, Reviews: ${lead.reviews || 0}`,
      last_scraped_at: new Date().toISOString(),
    }));

    const { data: insertedLeads, error: insertError } = await supabaseAdmin
      .from("leads")
      .upsert(formattedLeads, { onConflict: "place_id" })
      .select("id");

    if (insertError) throw insertError;

    if (userId && insertedLeads) {
      const userLeadsData = insertedLeads.map((lead) => ({
        user_id: userId,
        lead_id: lead.id,
        is_unlocked: false,
      }));
      await supabaseAdmin.from("user_leads").insert(userLeadsData);
    }

    if (body.id) {
      await supabaseAdmin
        .from("processed_requests")
        .update({ status: "completed" })
        .eq("request_id", body.id);
    }

    if (userId && process.env.RESEND_API_KEY) {
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

      if (userData?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "AlphaLeads <onboarding@resend.dev>",
          to: userData.email,
          subject: `Your scan for "${keyword}" is complete in AlphaLeads!`,
          html: `<p>Your background scan for <strong>${keyword}</strong> has successfully finished. Log in to view your ${formattedLeads.length} new leads.</p>`,
        });
      }
    }

    return NextResponse.json({ success: true, savedLeads: formattedLeads.length });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
