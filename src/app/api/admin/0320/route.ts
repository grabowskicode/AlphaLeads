import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { email, secret } = await req.json();

    // 1. Security Check: Block unauthorized users
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid admin secret" },
        { status: 401 },
      );
    }

    // 2. Tell Supabase to send the invite email
    const { data: authData, error: inviteError } =
      await supabaseAdmin.auth.admin.inviteUserByEmail(email);
    if (inviteError) throw inviteError;

    // 3. Add them to your users table
    const { error: dbError } = await supabaseAdmin.from("users").upsert({
      id: authData.user.id,
      email: email,
      created_at: new Date().toISOString(),
      is_active: true,
    });
    if (dbError) throw dbError;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
