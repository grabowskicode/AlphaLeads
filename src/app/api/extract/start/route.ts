import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase-admin"; // Ensure this is exported in your lib

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = session.user.id;
    const SCAN_COST = 100;

    // --- 1. CHECK CURRENT CREDITS (Using Admin Client) ---
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      addLog(`ERR: User ${userId} profile not found.`);
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    if (userData.credits < SCAN_COST) {
      addLog(`REJECTED: ${userId} has only ${userData.credits} credits.`);
      return NextResponse.json({ error: "Insufficient credits (100 required)." }, { status: 403 });
    }

    // --- 2. DEDUCT CREDITS (Admin Client bypasses RLS) ---
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ credits: userData.credits - SCAN_COST })
      .eq("id", userId);

    if (updateError) {
      addLog(`DB ERROR: Credit deduction failed: ${updateError.message}`);
      return NextResponse.json({ error: "Transaction failed." }, { status: 500 });
    }

    addLog(`SUCCESS: Deducted 100 credits. Scan starting...`);

    // --- 3. PREPARE GEOGRAPHIC DATA ---
    const [city, areasString] = location.split(" | ");
    const selectedAreas = areasString.split(",").map((a: string) => a.trim());

    const { data: zipData } = await supabase
      .from("postal_codes")
      .select("zip_code")
      .ilike("city", `%${city}%`)
      .in("admin2", selectedAreas);

    if (!zipData || zipData.length === 0) {
      await supabaseAdmin.from("users").update({ credits: userData.credits }).eq("id", userId);
      return NextResponse.json({ error: "Could not map zip codes." }, { status: 400 });
    }

    const zipCodes = zipData.map((z) => z.zip_code);
    const searchQueries = zipCodes.map((zip) => `${keyword} in ${zip}`).join(",");
    const dynamicLimit = Math.max(5, Math.floor(500 / zipCodes.length));

    // --- 4. START OUTSCRAPER (WITH EMAIL ENHANCEMENT) ---
    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(searchQueries)}&limit=${dynamicLimit}&async=true&domains_service=true`;

    const response = await fetch(apiUrl, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    });
    
    const data = await response.json();

    if (!data.id) {
      await supabaseAdmin.from("users").update({ credits: userData.credits }).eq("id", userId);
      addLog(`OUTSCRAPER FAILED. Credits refunded.`);
      return NextResponse.json({ error: "Outscraper failed." }, { status: 502 });
    }

    await supabase.from("processed_requests").insert({
      request_id: data.id,
      user_id: userId,
      status: "pending",
    });

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
