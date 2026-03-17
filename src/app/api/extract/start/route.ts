// src/app/api/extract/start/route.ts
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();

    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const userId = session.user.id;

<<<<<<< HEAD
    const [city, areasString] = location.split(" | ");
    if (!city || !areasString) {
      return NextResponse.json(
        { error: "Invalid location format." },
        { status: 400 },
      );
    }
    const selectedAreas = areasString.split(",").map((a: string) => a.trim());

    const { data: zipData, error: zipError } = await supabase
      .from("postal_codes")
      .select("zip_code")
      .ilike("city", `%${city}%`)
      .in("admin2", selectedAreas);

    if (zipError || !zipData || zipData.length === 0) {
      return NextResponse.json(
        { error: "Could not map zip codes for this area." },
        { status: 400 },
      );
=======
    // --- PRODUCTION ECONOMY SETTINGS ---
    const COST = 100;
    const LIMIT = 200;
    const MAX_SCANS = 10;
    const MONTHLY_CREDITS = 3000;

    // 1. GET USER DATA
    const { data: user } = await supabase
      .from("users")
      .select("credits, scans_this_month, billing_start_date")
      .eq("id", userId)
      .single();

    if (!user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. LAZY RESET LOGIC (New Month Check)
    const now = new Date();
    const billingStart = new Date(user.billing_start_date);
    const oneMonthLater = new Date(billingStart);
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

    if (now >= oneMonthLater) {
      await supabase
        .from("users")
        .update({
          scans_this_month: 0,
          credits: MONTHLY_CREDITS,
          billing_start_date: now.toISOString(),
        })
        .eq("id", userId);
    }

    // 3. ATOMIC TRANSACTION
    const { error: rpcError } = await supabase.rpc("start_scan_transaction", {
      p_user_id: userId,
      p_cost: COST,
      p_max_scans: MAX_SCANS,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 403 });
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
    }

    const zipCodes = zipData.map((z) => z.zip_code);

    if (zipCodes.length > 50) {
      return NextResponse.json(
        { error: "Maximum of 50 zip codes exceeded." },
        { status: 400 },
      );
    }

    // 🚨 THE 500 MAX CAP: mathematically prevents user from exceeding $15/month
    const MAX_RESULTS_TOTAL = 500;
    const dynamicLimit = Math.max(
      5,
      Math.floor(MAX_RESULTS_TOTAL / zipCodes.length),
    );

    // 🚨 CONSUME 1 SCAN (Costs 0 Credits)
    const { error: rpcError } = await supabase.rpc("start_scan_transaction", {
      p_user_id: userId,
    });

    if (rpcError) {
      return NextResponse.json({ error: rpcError.message }, { status: 403 });
    }

    const searchQueries = zipCodes
      .map((zip) => `${keyword} in ${zip}`)
      .join(",");
    addLog(
      `STARTING ASYNC JOB: ${zipCodes.length} zips for "${keyword}" (1 Scan consumed)`,
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:9002";
    const webhookToken = process.env.WEBHOOK_SECRET;
    if (!webhookToken)
      throw new Error("Server configuration error: Missing WEBHOOK_SECRET");

    // We no longer pass 'cost' in the webhook URL because scans are free
    const webhookUrl = `${appUrl}/api/webhooks/outscraper?userId=${userId}&keyword=${encodeURIComponent(keyword)}&token=${webhookToken}`;

    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(searchQueries)}&limit=${dynamicLimit}&async=true&webhookUrl=${encodeURIComponent(webhookUrl)}`;

    const response = await fetch(apiUrl, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    });
    const data = await response.json();

    if (!data.id) {
<<<<<<< HEAD
      // Instant API Failure = Refund the scan
      await supabase.rpc("refund_scan", { p_user_id: userId });
      throw new Error("Outscraper API Failed. Scan Refunded.");
    }

=======
      await supabase.rpc("increment_credits", {
        p_user_id: userId,
        p_amount: COST,
      });
      throw new Error("Outscraper API Failed. Credits Refunded.");
    }

    // 🚨 CRITICAL FIX: Save the ID to the database so the frontend can track it
>>>>>>> 2f200a9 (Fix: Link scraped leads to user_leads table and update webhook URL)
    await supabase.from("processed_requests").insert({
      request_id: data.id,
      user_id: userId,
      status: "pending",
    });

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    console.error("Start Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
