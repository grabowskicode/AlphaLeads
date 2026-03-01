import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${process.env.WEBHOOK_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { email } = await req.json();
    if (!email)
      return NextResponse.json({ error: "Email required" }, { status: 400 });

    // 1. Send the magic invite link
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (authError) throw authError;

    // 2. Add them to the profiles table
    const { error: dbError } = await supabaseAdmin.from("profiles").upsert({
      id: authData.user.id,
      email,
      join_date: new Date().toISOString(),
      is_active: true,
    });

    if (dbError) throw dbError;

    return NextResponse.json({
      success: true,
      message: `Invite sent to ${email}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
