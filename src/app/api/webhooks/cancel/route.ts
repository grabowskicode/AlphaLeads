import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();

    // 1. Find the user (changed from 'join_date' to 'created_at')
    const { data: user, error: fetchError } = await supabaseAdmin
      .from("users")
      .select("id, created_at")
      .eq("email", email)
      .single();

    if (fetchError || !user)
      return NextResponse.json({ error: "User not found" }, { status: 404 });

    // 2. Calculate the end of their current 30-day billing cycle
    const joinDate = new Date(user.created_at);
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
      .from("users")
      .update({ access_expires_at: expiryDate.toISOString() })
      .eq("id", user.id);

    if (updateError) throw updateError;

    return NextResponse.json({ success: true, expiresAt: expiryDate });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
