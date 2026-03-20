import { NextResponse } from "next/server";
import { Resend } from "resend";
import { addLog } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase-admin"; 

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const userId = searchParams.get("userId");
    const keyword = searchParams.get("keyword") || "Unknown";
    const token = searchParams.get("token");

    addLog(`[WEBHOOK] Incoming payload received for Request ID: ${requestId?.slice(0, 8)}`);

    // 1. Security Check
    if (token !== process.env.WEBHOOK_SECRET) {
      addLog(`[ERROR] SECURITY: Invalid webhook token received.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    let allLeads: any[] = [];

    // Outscraper sends data in query groups
    if (body.data && Array.isArray(body.data)) {
      body.data.forEach((queryGroup: any) => {
        if (Array.isArray(queryGroup)) {
          allLeads = allLeads.concat(queryGroup);
        }
      });
    }

    addLog(`[FILTER] Received ${allLeads.length} raw results. Analyzing quality...`);

    // 2. Filtration Logic
    const badBusinesses = allLeads.filter((lead: any) => {
      const hasWebsite = lead.website && lead.website.trim() !== "";
      const hasGoodRating = lead.rating && lead.rating > 4.0;
      return !hasWebsite || !hasGoodRating;
    });

    if (badBusinesses.length === 0) {
      addLog(`[SYSTEM] No actionable leads found in this batch. Processing refund...`);
      if (userId) {
        await supabaseAdmin.from("users").select("credits").eq("id", userId).single().then(async ({ data }) => {
            if (data) await supabaseAdmin.from("users").update({ credits: data.credits + 100 }).eq("id", userId);
        });
        addLog(`[SUCCESS] 100 credits restored to user ${userId.slice(0, 8)}.`);
      }
      return NextResponse.json({ success: true, message: "Refunded" });
    }

    addLog(`[FILTER] Identified ${badBusinesses.length} leads matching "Pain Points" criteria.`);

    // 3. ENRICHMENT MAPPING (Fixes Email Issue)
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
      
      // EMAIL & CONTACT ENRICHMENT FIELDS
      email: lead.email || (lead.emails && lead.emails[0]) || null,
      full_name: lead.full_name || null,
      linkedin: lead.linkedin || (lead.social_links && lead.social_links.linkedin) || null,
      
      bucket_category: lead.website ? "Bad Reviews" : "Needs Website",
      bucket_details: `Rating: ${lead.rating || 0}, Reviews: ${lead.reviews || 0}`,
      last_scraped_at: new Date().toISOString(),
    }));

    addLog(`[DATABASE] Syncing ${formattedLeads.length} leads with email enrichment...`);

    // 4. Save to Database
    const { data: insertedLeads, error: insertError } = await supabaseAdmin
      .from("leads")
      .upsert(formattedLeads, { onConflict: "place_id" })
      .select("id");

    if (insertError) {
        addLog(`[ERROR] DB Insert failed: ${insertError.message}`);
        throw insertError;
    }

    if (userId && insertedLeads) {
      const userLeadsData = insertedLeads.map((lead) => ({
        user_id: userId,
        lead_id: lead.id,
        is_unlocked: false,
      }));
      await supabaseAdmin.from("user_leads").insert(userLeadsData);
    }

    // 5. Update Status & Notify
    if (body.id) {
      await supabaseAdmin.from("processed_requests").update({ status: "completed" }).eq("request_id", body.id);
      addLog(`[SUCCESS] Pipeline completed for ID: ${body.id}`);
    }

    if (userId && process.env.RESEND_API_KEY) {
      const { data: userData } = await supabaseAdmin.from("users").select("email").eq("id", userId).single();
      if (userData?.email) {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "AlphaLeads <onboarding@resend.dev>",
          to: userData.email,
          subject: `Results ready: ${keyword}`,
          html: `<p>Found <strong>${formattedLeads.length}</strong> new leads for <strong>${keyword}</strong>.</p>`,
        });
        addLog(`[SYSTEM] Confirmation email dispatched to ${userData.email}.`);
      }
    }

    addLog(`[FINISH] Webhook fulfillment complete. System standing by.`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    addLog(`[CRITICAL] Webhook processing failed: ${error.message}`);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
