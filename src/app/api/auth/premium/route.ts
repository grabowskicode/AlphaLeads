import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { email, password, licenseKey } = await req.json();

    if (!email || !password || !licenseKey) {
      return NextResponse.json(
        { error: "Email, password, and License Key are required." },
        { status: 400 },
      );
    }

    // 1. Verify the License Key
    const { data: keyData, error: keyError } = await supabaseAdmin
      .from("license_keys")
      .update({ is_used: true })
      .eq("pin_code", licenseKey)
      .eq("is_used", false)
      .select()
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: "Invalid or already used License Key." },
        { status: 400 },
      );
    }

    // 2. STRICT SECURITY CHECK: Does this email already exist?
    const { data: existingUser } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      // 🚨 BLOCKS ACCOUNT TAKEOVER 🚨
      return NextResponse.json(
        {
          error:
            "This email is already registered. Please log in to your dashboard to upgrade safely.",
        },
        { status: 403 },
      );
    }

    // 3. Safe to create a brand new user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });

    if (authError)
      return NextResponse.json({ error: authError.message }, { status: 400 });
    const userId = authData.user.id;

    // 4. Inject 3,000 Premium Credits
    const { error: dbError } = await supabaseAdmin.from("users").upsert({
      id: userId,
      email: email,
      credits: 3000,
      scans_this_month: 0,
      tier: "premium",
      needs_password_change: false,
      created_at: new Date().toISOString(),
      is_active: true,
    });

    if (dbError) throw dbError;

    // 5. BURN THE KEY
    await supabaseAdmin
      .from("license_keys")
      .update({ is_used: true })
      .eq("pin_code", licenseKey);

    return NextResponse.json({
      success: true,
      message: "Premium account secured successfully.",
    });
  } catch (error: any) {
    console.error("Premium Signup Error:", error);
    return NextResponse.json(
      { error: "System error occurred" },
      { status: 500 },
    );
  }
}
