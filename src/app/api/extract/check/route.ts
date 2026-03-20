import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const requestId = searchParams.get("requestId");
    const userId = searchParams.get("userId");

    if (!requestId || !userId) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 });
    }

    const response = await fetch(`https://api.app.outscraper.com/requests/${requestId}`, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    });
    
    const taskData = await response.json();
    const currentStatus = taskData.status ? taskData.status.toUpperCase() : "UNKNOWN";

    if (currentStatus === "PENDING" || currentStatus === "PROCESSING") {
      return NextResponse.json({ status: "pending" });
    }
    
    if (currentStatus === "FAILURE") {
      await supabaseAdmin.from("processed_requests").update({ status: "failed" }).eq("request_id", requestId);
      return NextResponse.json({ status: "failed" });
    }

    if (currentStatus === "SUCCESS" && taskData.data) {
      const firstBatch = taskData.data[0];
      const firstItem = Array.isArray(firstBatch) ? firstBatch[0] : firstBatch;
      const isMapsTask = firstItem && firstItem.place_id !== undefined;

      // ==========================================
      // PHASE 1: MAPS SCRAPE 
      // ==========================================
      if (isMapsTask) {
        let allLeads: any[] = [];
        taskData.data.forEach((queryGroup: any) => {
          if (Array.isArray(queryGroup)) allLeads = allLeads.concat(queryGroup);
        });

        // Filter for bad businesses
        const badBusinesses = allLeads.filter((lead: any) => {
          const hasWebsite = lead.website && lead.website.trim() !== "";
          const hasGoodRating = lead.rating && lead.rating > 4.0;
          return !hasWebsite || !hasGoodRating;
        });

        if (badBusinesses.length === 0) {
          await supabaseAdmin.from("processed_requests").update({ status: "completed" }).eq("request_id", requestId);
          return NextResponse.json({ status: "completed", message: "No actionable leads found." });
        }

        const formattedLeads = badBusinesses.map((lead: any) => ({
          place_id: lead.place_id,
          business_name: lead.name,
          city: lead.city || lead.location_city,
          zip_code: lead.postal_code,
          keyword: "Background Scan",
          rating: lead.rating || 0,
          review_count: lead.reviews || 0,
          website: lead.website || null,
          phone: lead.phone || null, // Phone is captured here
          bucket_category: lead.website ? "Bad Reviews" : "Needs Website",
          last_scraped_at: new Date().toISOString(),
        }));

        const { data: insertedLeads } = await supabaseAdmin.from("leads").upsert(formattedLeads, { onConflict: "place_id" }).select("id");
        if (insertedLeads) {
          const userLeadsData = insertedLeads.map((lead) => ({ user_id: userId, lead_id: lead.id, is_unlocked: false }));
          await supabaseAdmin.from("user_leads").insert(userLeadsData);
        }

        // TRIGGER PHASE 2: Fetch Emails only
        const websitesToEnrich = badBusinesses
          .filter((b) => b.website && b.website.trim() !== "")
          .map((b) => b.website.split("?")[0]) 
          .slice(0, 50);

        if (websitesToEnrich.length > 0) {
          const enrichApiUrl = `https://api.app.outscraper.com/emails-and-contacts?query=${encodeURIComponent(websitesToEnrich.join(","))}&async=true`;
          const enrichRes = await fetch(enrichApiUrl, { headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! } });
          const enrichData = await enrichRes.json();

          if (enrichData.id) {
            return NextResponse.json({ status: "enriching", newRequestId: enrichData.id });
          }
        }
        
        await supabaseAdmin.from("processed_requests").update({ status: "completed" }).eq("request_id", requestId);
        return NextResponse.json({ status: "completed" });
      } 
      
      // ==========================================
      // PHASE 2: EMAIL ENRICHMENT
      // ==========================================
      else {
        let emailResults: any[] = [];
        taskData.data.forEach((item: any) => {
          if (Array.isArray(item)) emailResults = emailResults.concat(item);
          else emailResults.push(item);
        });

        // Map strictly to the email column
        for (const result of emailResults) {
          const targetWebsite = result.query;
          const bestEmailObj = result.emails && result.emails.length > 0 ? result.emails[0] : null;
          const email = bestEmailObj ? bestEmailObj.value : null;

          if (email) {
            await supabaseAdmin
              .from("leads")
              .update({ email: email })
              .ilike("website", `%${targetWebsite}%`);
          }
        }

        await supabaseAdmin.from("processed_requests").update({ status: "completed" }).eq("request_id", requestId);
        return NextResponse.json({ status: "completed" });
      }
    }

    return NextResponse.json({ status: "unknown" });
  } catch (error: any) {
    console.error("Check Route Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
