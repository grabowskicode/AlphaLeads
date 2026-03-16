import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Simple in-memory rate limiter (Works well for serverless cold-starts on Vercel)
const rateLimitMap = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 Hour
const MAX_REQUESTS_PER_WINDOW = 3;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(ip);

  if (!userLimit) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, lastReset: now });
    return false;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }

  userLimit.count += 1;
  return false;
}

export async function POST(req: Request) {
  try {
    // 1. RATE LIMITING CHECK
    const ip = req.headers.get("x-forwarded-for") || "unknown-ip";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in an hour." },
        { status: 429 },
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 2. Cryptographically secure PIN generation
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const generatedPin = (100000 + (array[0] % 900000)).toString();

    // 3. Silently create the user in Supabase
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: generatedPin,
        email_confirm: true,
      });

    if (authError) {
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 4. Inject 20 Free Trial Credits
    const { error: dbError } = await supabaseAdmin.from("users").upsert({
      id: userId,
      email: email,
      credits: 20,
      scans_this_month: 0,
      tier: "free",
      needs_password_change: false,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    if (dbError) throw dbError;

    // 5. Send the email
    await resend.emails.send({
      from: "AlphaLeads <noreply@help.alphaleads.app>",
      to: email,
      subject: "Your AlphaLeads Free Trial Access 🚀",
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; color: #111;">
          <h2 style="color: #000;">Welcome to AlphaLeads!</h2>
          <p>Your free trial account has been created and loaded with <strong>20 Free Credits</strong>.</p>
          <p>Here is your secure login PIN:</p>
          <h1 style="background: #f4f4f5; padding: 20px; text-align: center; letter-spacing: 8px; border-radius: 8px; font-size: 32px; color: #000;">
            ${generatedPin}
          </h1>
          <p>Go back to the AlphaLeads page and enter this PIN to start scraping immediately.</p>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "PIN sent successfully",
    });
  } catch (error: any) {
    console.error("Trial Signup Error:", error);
    return NextResponse.json(
      { error: "System error occurred" },
      { status: 500 },
    );
  }
}
