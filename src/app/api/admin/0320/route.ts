import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";

// Make sure you have RESEND_API_KEY in your .env and Vercel!
const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  try {
    const { email, secret } = await req.json();

    // 1. Security Check
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid admin secret" },
        { status: 401 },
      );
    }

    // 2. Generate a random 6-digit permanent password
    const tempPassword = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Create the user instantly (skipping the Supabase invite link)
    const { data: authData, error: createError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: tempPassword,
        email_confirm: true, // This automatically verifies them!
      });
    if (createError) throw createError;

    // 4. Add them to your public database table
    const { error: dbError } = await supabaseAdmin.from("users").upsert({
      id: authData.user.id,
      email: email,
      created_at: new Date().toISOString(),
      is_active: true,
    });
    if (dbError) throw dbError;

    // 5. Send a pure text email (Zero links = High Deliverability)
    await resend.emails.send({
      from: "AlphaLeads <noreply@help.alphaleads.app>",
      to: email,
      subject: "your AlphaLeads account details",
      text: `Welcome to AlphaLeads!

    Your account has been securely created. Please log in here:
    https://www.alphaleads.app/login

    Email: ${email}
    Password: ${tempPassword}

    You will be prompted to change this password immediately after logging in.

    Best,
    Vincent`,
    });

    return NextResponse.json({ success: true, password: tempPassword });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
