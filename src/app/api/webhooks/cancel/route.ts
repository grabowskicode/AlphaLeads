import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    // 1. Find the user
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id, join_date")
      .eq("email", email)
      .single();

    if (fetchError || !profile)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Calculate the end of their current 30-day billing cycle
    const joinDate = new Date(profile.join_date);
    const today = new Date();

    let expiryDate = new Date(
      today.getFullYear(),
      today.getMonth(),
      joinDate.getDate(),
    );
    if (today > expiryDate) {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }

    // 3. Save the expiration date
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ access_expires_at: expiryDate.toISOString() })
      .eq("id", profile.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, expiresAt: expiryDate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
