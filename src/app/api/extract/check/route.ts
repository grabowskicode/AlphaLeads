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
      return NextResponse.json(
        { error: "Missing parameters" },
        { status: 400 },
      );
    }

    // 1. Ask Outscraper directly: "Is this task done?"
    const response = await fetch(
      `https://api.app.outscraper.com/requests/${requestId}`,
      {
        headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
      },
    );

    const taskData = await response.json();

    // 2. If it's still running, just tell the frontend to keep waiting
    if (taskData.status === "Pending" || taskData.status === "Processing") {
      return NextResponse.json({ status: "pending" });
    }

    // 3. If it failed on their end, refund the user
    if (taskData.status === "Failure") {
      await supabaseAdmin.rpc("refund_scan", { p_user_id: userId });
      await supabaseAdmin
        .from("processed_requests")
        .update({ status: "failed" })
        .eq("request_id", requestId);
      return NextResponse.json({ status: "failed" });
    }

    // 4. If Success, process the data immediately!
    if (taskData.status === "Success" && taskData.data) {
      let allLeads: any[] = [];
      taskData.data.forEach((queryGroup: any) => {
        if (Array.isArray(queryGroup)) allLeads = allLeads.concat(queryGroup);
      });

      const badBusinesses = allLeads.filter((lead: any) => {
        const hasWebsite = lead.website && lead.website.trim() !== "";
        const hasGoodRating = lead.rating && lead.rating > 4.0;
        return !hasWebsite || !hasGoodRating;
      });

      if (badBusinesses.length === 0) {
        await supabaseAdmin.rpc("refund_scan", { p_user_id: userId });
        await supabaseAdmin
          .from("processed_requests")
          .update({ status: "completed" })
          .eq("request_id", requestId);
        return NextResponse.json({
          status: "completed",
          message: "No actionable leads found.",
        });
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
        phone: lead.phone || null,
        bucket_category: lead.website ? "Bad Reviews" : "Needs Website",
        last_scraped_at: new Date().toISOString(),
      }));

      // Insert Leads
      const { data: insertedLeads } = await supabaseAdmin
        .from("leads")
        .upsert(formattedLeads, { onConflict: "place_id" })
        .select("id");

      // Assign to User
      if (insertedLeads) {
        const userLeadsData = insertedLeads.map((lead) => ({
          user_id: userId,
          lead_id: lead.id,
          is_unlocked: false,
        }));
        await supabaseAdmin.from("user_leads").insert(userLeadsData);
      }

      // Mark Job as Completed
      await supabaseAdmin
        .from("processed_requests")
        .update({ status: "completed" })
        .eq("request_id", requestId);

      return NextResponse.json({
        status: "completed",
        totalSaved: formattedLeads.length,
      });
    }

    return NextResponse.json({ status: "unknown" });
  } catch (error: any) {
    console.error("Manual Check Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
