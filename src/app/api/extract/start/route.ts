import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = session.user.id;
    const SCAN_COST = 100;

    // --- 1. CHECK CURRENT CREDITS ---
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    if (userData.credits < SCAN_COST) {
      addLog(`INSUFFICIENT CREDITS: User ${userId} tried to scan.`);
      return NextResponse.json({ error: "Insufficient credits (100 required)." }, { status: 403 });
    }

    // --- 2. DEDUCT CREDITS IN CODE ---
    const newBalance = userData.credits - SCAN_COST;
    const { error: updateError } = await supabase
      .from("users")
      .update({ credits: newBalance })
      .eq("id", userId);

    if (updateError) {
      return NextResponse.json({ error: "Failed to process credit transaction." }, { status: 500 });
    }

    // --- 3. PREPARE GEOGRAPHIC DATA ---
    const [city, areasString] = location.split(" | ");
    const selectedAreas = areasString.split(",").map((a: string) => a.trim());

    const { data: zipData } = await supabase
      .from("postal_codes")
      .select("zip_code")
      .ilike("city", `%${city}%`)
      .in("admin2", selectedAreas);

    if (!zipData || zipData.length === 0) {
      // Refund if zip mapping fails
      await supabase.from("users").update({ credits: userData.credits }).eq("id", userId);
      return NextResponse.json({ error: "Could not map zip codes." }, { status: 400 });
    }

    const zipCodes = zipData.map((z) => z.zip_code);
    const searchQueries = zipCodes.map((zip) => `${keyword} in ${zip}`).join(",");
    const dynamicLimit = Math.max(5, Math.floor(500 / zipCodes.length));

    // --- 4. START OUTSCRAPER (WITH EMAIL ENHANCEMENT) ---
    // Added 'domains_service=true' to fix the email issue
    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(searchQueries)}&limit=${dynamicLimit}&async=true&domains_service=true`;

    addLog(`DEDUCTED ${SCAN_COST} CREDITS. Starting enriched scan for ${zipCodes.length} zips.`);

    const response = await fetch(apiUrl, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    });
    
    const data = await response.json();

    if (!data.id) {
      // Refund credits if the API call itself fails
      await supabase.from("users").update({ credits: userData.credits }).eq("id", userId);
      addLog(`OUTSCRAPER FAILED. Credits refunded to user.`);
      return NextResponse.json({ error: "Outscraper failed to initiate." }, { status: 502 });
    }

    // Track the request
    await supabase.from("processed_requests").insert({
      request_id: data.id,
      user_id: userId,
      status: "pending",
    });

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    console.error("Critical Start Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
