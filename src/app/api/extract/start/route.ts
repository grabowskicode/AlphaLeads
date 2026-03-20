import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";
import { supabaseAdmin } from "@/lib/supabase-admin"; 

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    addLog(`[INIT] Initializing extraction for: "${keyword}" in "${location}"`);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      addLog(`[AUTH] ERROR: Unauthorized access attempt.`);
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const userId = session.user.id;
    const SCAN_COST = 100;

    // --- 1. CREDIT PHASE ---
    addLog(`[AUTH] Verifying user balance for ID: ${userId.slice(0, 8)}...`);
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      addLog(`[ERROR] User profile not found in database.`);
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    if (userData.credits < SCAN_COST) {
      addLog(`[AUTH] REJECTED: Insufficient balance (${userData.credits} credits).`);
      return NextResponse.json({ error: "Insufficient credits (100 required)." }, { status: 403 });
    }

    addLog(`[AUTH] Balance verified. Processing 100 credit transaction...`);
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ credits: userData.credits - SCAN_COST })
      .eq("id", userId);

    if (updateError) {
      addLog(`[ERROR] Credit deduction failed: ${updateError.message}`);
      return NextResponse.json({ error: "Transaction failed." }, { status: 500 });
    }

    addLog(`[SUCCESS] Transaction complete. New balance: ${userData.credits - SCAN_COST}`);

    // --- 2. GEOGRAPHIC PHASE ---
    addLog(`[GEO] Parsing location: ${location}`);
    const [city, areasString] = location.split(" | ");
    if (!city || !areasString) {
      addLog(`[ERROR] Invalid location format received.`);
      return NextResponse.json({ error: "Invalid location format." }, { status: 400 });
    }

    const selectedAreas = areasString.split(",").map((a: string) => a.trim());
    addLog(`[GEO] Mapping ${selectedAreas.length} selected areas to postal code database...`);

    const { data: zipData } = await supabase
      .from("postal_codes")
      .select("zip_code")
      .ilike("city", `%${city}%`)
      .in("admin2", selectedAreas);

    if (!zipData || zipData.length === 0) {
      addLog(`[GEO] ERROR: No zip codes found for ${city}. Refunding credits...`);
      await supabaseAdmin.from("users").update({ credits: userData.credits }).eq("id", userId);
      return NextResponse.json({ error: "Could not map zip codes." }, { status: 400 });
    }

    const zipCodes = zipData.map((z) => z.zip_code);
    addLog(`[GEO] Successfully identified ${zipCodes.length} target zip codes.`);

    const searchQueries = zipCodes.map((zip) => `${keyword} in ${zip}`).join(",");
    const dynamicLimit = Math.max(5, Math.floor(500 / zipCodes.length));
    addLog(`[OUTSCRAPER] Parameters set: Limit=${dynamicLimit} leads per zip code.`);

    // --- 3. NETWORK PHASE ---
    addLog(`[NETWORK] Dispatching request with Contact & Email Enrichment...`);
    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(searchQueries)}&limit=${dynamicLimit}&async=true&domains_service=true`;

    const response = await fetch(apiUrl, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    });
    
    const data = await response.json();

    if (!data.id) {
      addLog(`[NETWORK] ERROR: API handshake failed. Refunding credits...`);
      await supabaseAdmin.from("users").update({ credits: userData.credits }).eq("id", userId);
      return NextResponse.json({ error: "Outscraper failed." }, { status: 502 });
    }

    addLog(`[SUCCESS] Task accepted. Outscraper ID: ${data.id}`);

    // --- 4. TRACKING PHASE ---
    addLog(`[DATABASE] Registering pending request for background monitoring...`);
    await supabase.from("processed_requests").insert({
      request_id: data.id,
      user_id: userId,
      status: "pending",
    });

    addLog(`[SYSTEM] Sequence complete. Waiting for webhook fulfillment.`);

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    addLog(`[CRITICAL] Unexpected server error: ${error.message}`);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
