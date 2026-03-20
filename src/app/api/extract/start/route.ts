import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { addLog } from "@/lib/logger";
// Import the admin client to bypass RLS for credit updates
import { supabaseAdmin } from "@/lib/supabase-admin"; 

export async function POST(req: Request) {
  try {
    const { keyword, location } = await req.json();
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // 1. Authenticate the user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const userId = session.user.id;
    const SCAN_COST = 100;

    addLog(`TRANSACTION START: Checking credits for user ${userId}`);

    // 2. CHECK CREDITS (Using Admin Client for reliability)
    const { data: userData, error: userError } = await supabaseAdmin
      .from("users")
      .select("credits")
      .eq("id", userId)
      .single();

    if (userError || !userData) {
      addLog(`ERROR: User profile not found in database.`);
      return NextResponse.json({ error: "User profile not found." }, { status: 404 });
    }

    if (userData.credits < SCAN_COST) {
      addLog(`REJECTED: Insufficient credits. Has: ${userData.credits}, Needs: ${SCAN_COST}`);
      return NextResponse.json({ error: "Insufficient credits (100 required)." }, { status: 403 });
    }

    // 3. DEDUCT CREDITS (Using Admin Client to bypass RLS)
    const newBalance = userData.credits - SCAN_COST;
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({ credits: newBalance })
      .eq("id", userId);

    if (updateError) {
      addLog(`DB ERROR: Credit deduction failed: ${updateError.message}`);
      return NextResponse.json({ error: "Credit transaction failed." }, { status: 500 });
    }

    addLog(`SUCCESS: Deducted ${SCAN_COST} credits. New balance: ${newBalance}`);

    // 4. PREPARE GEOGRAPHIC DATA
    const [city, areasString] = location.split(" | ");
    const selectedAreas = areasString.split(",").map((a: string) => a.trim());

    const { data: zipData } = await supabase
      .from("postal_codes")
      .select("zip_code")
      .ilike("city", `%${city}%`)
      .in("admin2", selectedAreas);

    if (!zipData || zipData.length === 0) {
      // Automatic Refund if geographic mapping fails
      await supabaseAdmin.from("users").update({ credits: userData.credits }).eq("id", userId);
      addLog(`REFUNDED: Could not map zip codes for ${location}.`);
      return NextResponse.json({ error: "Could not map zip codes." }, { status: 400 });
    }

    const zipCodes = zipData.map((z) => z.zip_code);
    const searchQueries = zipCodes.map((zip) => `${keyword} in ${zip}`).join(",");
    const dynamicLimit = Math.max(5, Math.floor(500 / zipCodes.length));

    // 5. START OUTSCRAPER (With Email Enhancement active)
    const apiUrl = `https://api.app.outscraper.com/maps/search-v2?query=${encodeURIComponent(searchQueries)}&limit=${dynamicLimit}&async=true&domains_service=true`;

    const response = await fetch(apiUrl, {
      headers: { "X-API-KEY": process.env.OUTSCRAPER_API_KEY! },
    });
    
    const data = await response.json();

    if (!data.id) {
      // Automatic Refund if Outscraper API fails to launch
      await supabaseAdmin.from("users").update({ credits: userData.credits }).eq("id", userId);
      addLog(`REFUNDED: Outscraper API failed to initiate.`);
      return NextResponse.json({ error: "Outscraper failed to initiate." }, { status: 502 });
    }

    // 6. Track the request
    await supabase.from("processed_requests").insert({
      request_id: data.id,
      user_id: userId,
      status: "pending",
    });

    addLog(`SCAN ACTIVE: Request ID ${data.id} is now processing.`);

    return NextResponse.json({ success: true, requestId: data.id });
  } catch (error: any) {
    console.error("Critical Start Error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
