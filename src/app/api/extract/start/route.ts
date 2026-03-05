import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();

    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const userId = session.user.id;

    // --- PRODUCTION ECONOMY SETTINGS ---
    const COST = 100;
    const LIMIT = 200;
    const MAX_SCANS = 10;
    const MONTHLY_CREDITS = 3000;

    // 1. GET USER DATA (For Lazy Reset Only)
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

    // 3. ATOMIC TRANSACTION (The "Anti-Hack" Fix)
    // We call the Database Function to check balance & deduct safely.
    const { error: rpcError } = await supabase.rpc("start_scan_transaction", {
      p_user_id: userId,
      p_cost: COST,
      p_max_scans: MAX_SCANS,
    });

    if (rpcError) {
      // Return specific error messages to frontend
      return NextResponse.json(
        { error: rpcError.message }, // "Insufficient Credits" or "Limit Reached"
        { status: 403 },
      );
    }

    // 4. EXECUTE SCRAPE
    const apiKey = process.env.OUTSCRAPER_API_KEY;
    const searchQuery = `${keyword} in ${location}`;
    addLog(`STARTING JOB: "${searchQuery}" (-${COST} credits)`);

    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(
      searchQuery,
    )}&limit=${LIMIT}&async=true&reviewsLimit=3&reviewsSort=newest&extractEmails=true&extractContacts=true&emailValidation=true`;

    const response = await fetch(apiUrl, { headers: { "X-API-KEY": apiKey! } });
    const data = await response.json();

    if (!data.id) {
      // Refund if API call fails immediately
      // Note: We use a simple increment here because it's a refund, risk is low.
      await supabase.rpc("increment_credits", {
        p_user_id: userId,
        p_amount: COST,
      });

      throw new Error("Outscraper API Failed. Credits Refunded.");
    }

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    console.error("Start Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
