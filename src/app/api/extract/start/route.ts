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
    }

    const zipCodes = zipData.map((z) => z.zip_code);

    if (zipCodes.length > 50) {
      return NextResponse.json(
        { error: "Maximum of 50 zip codes exceeded." },
        { status: 400 },
      );
    }

    const MAX_RESULTS_TOTAL = 500;
    const dynamicLimit = Math.max(
      5,
      Math.floor(MAX_RESULTS_TOTAL / zipCodes.length),
    );

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

    // --- FIX: Bulletproof URL Generation ---
    let appUrl =
      process.env.NEXT_PUBLIC_APP_URL || "https://www.alphaleads.app";
    if (appUrl.endsWith("/")) {
      appUrl = appUrl.slice(0, -1); // Strip trailing slash to prevent Vercel redirects
    }

    const webhookToken = process.env.WEBHOOK_SECRET;
    if (!webhookToken)
      throw new Error("Server configuration error: Missing WEBHOOK_SECRET");

    // Put token FIRST in the query string to prevent Outscraper truncation
    const webhookUrl = `${appUrl}/api/webhooks/outscraper?token=${webhookToken}&userId=${userId}&keyword=${encodeURIComponent(keyword)}`;

    if (!data.id) {
      await supabase.rpc("refund_scan", { p_user_id: userId });
      throw new Error("Outscraper API Failed. Scan Refunded.");
    }

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
