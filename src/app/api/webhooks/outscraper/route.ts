<<<<<<< HEAD
// src/app/api/webhooks/outscraper/route.ts
=======
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
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

<<<<<<< HEAD
    // 🚨 SECURE: Verify the Secret Token
=======
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
    const token = searchParams.get("token");
    if (token !== process.env.WEBHOOK_SECRET) {
      console.error("CRITICAL: Unauthorized webhook attempt blocked.");
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const userId = searchParams.get("userId");
    const keyword = searchParams.get("keyword") || "Unknown";

    const body = await req.json();
    let allLeads: any[] = [];

<<<<<<< HEAD
    // FIX 1: Correctly unpack the Outscraper arrays
=======
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((queryGroup: any) => {
        if (Array.isArray(queryGroup)) {
          allLeads = allLeads.concat(queryGroup);
        }
      });
    }

<<<<<<< HEAD
    // FIX 2: Check lead.website instead of lead.site
=======
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
    const badBusinesses = allLeads.filter((lead: any) => {
      const hasWebsite = lead.website && lead.website.trim() !== "";
      const hasGoodRating = lead.rating && lead.rating > 4.0;
      return !hasWebsite || !hasGoodRating;
    });

<<<<<<< HEAD
    // 🚨 IF ZERO LEADS FOUND: Refund the scan so the user isn't penalized
    if (badBusinesses.length === 0) {
      if (userId) {
        await supabaseAdmin.rpc("refund_scan", { p_user_id: userId });
        console.log(
          `Scan refunded for User ${userId} (0 actionable leads found)`,
        );
=======
    if (badBusinesses.length === 0) {
      if (userId) {
        await supabaseAdmin.rpc("refund_scan", { p_user_id: userId });
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
      }
      return NextResponse.json({
        success: true,
        message: "No actionable businesses found. Scan refunded.",
      });
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

<<<<<<< HEAD
    const { error: insertError } = await supabaseAdmin
      .from("leads")
      .upsert(formattedLeads, { onConflict: "place_id" });

    if (insertError) {
      console.error("Database Insert Error:", insertError);
      throw insertError;
=======
    // 1. Insert leads and get IDs back
    const { data: insertedLeads, error: insertError } = await supabaseAdmin
      .from("leads")
      .upsert(formattedLeads, { onConflict: "place_id" })
      .select("id");

    if (insertError) throw insertError;

    // 2. Map the leads to the specific user
    if (userId && insertedLeads) {
      const userLeadsData = insertedLeads.map((lead) => ({
        user_id: userId,
        lead_id: lead.id,
        is_unlocked: false,
      }));

      // 3. Save the relationship
      await supabaseAdmin.from("user_leads").insert(userLeadsData);
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
    }

    if (body.id) {
      await supabaseAdmin
        .from("processed_requests")
        .update({ status: "completed" })
        .eq("request_id", body.id);
    }

<<<<<<< HEAD
    // Send Success Email
    if (userId) {
=======
    if (userId && process.env.RESEND_API_KEY) {
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
      const { data: userData } = await supabaseAdmin
        .from("users")
        .select("email")
        .eq("id", userId)
        .single();

<<<<<<< HEAD
      if (userData?.email && process.env.RESEND_API_KEY) {
        const resend = new Resend(process.env.RESEND_API_KEY);

=======
      if (userData?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
        await resend.emails.send({
          from: "AlphaLeads <onboarding@resend.dev>",
          to: userData.email,
          subject: `Your scan for "${keyword}" is complete!`,
<<<<<<< HEAD
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Great news!</h2>
              <p>Your background scan for <strong>${keyword}</strong> has successfully finished processing.</p>
              <div style="background-color: #f4f4f5; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 0 0 10px 0;"><strong>Scan Results:</strong></p>
                <ul style="margin: 0;">
                  <li><strong>High-Value Leads Found:</strong> ${formattedLeads.length}</li>
                </ul>
              </div>
              <p>Log in to your dashboard to view and unlock their contact information.</p>
            </div>
          `,
=======
          html: `<p>Your background scan for <strong>${keyword}</strong> has successfully finished. Log in to view your ${formattedLeads.length} new leads.</p>`,
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
        });
      }
    }

    return NextResponse.json({
      success: true,
      savedLeads: formattedLeads.length,
    });
  } catch (error: any) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
