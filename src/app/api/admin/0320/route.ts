import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const { secret } = await req.json();

    // 1. Security Check: Must match your .env WEBHOOK_SECRET
    if (secret !== process.env.WEBHOOK_SECRET) {
      return NextResponse.json(
        { error: "Invalid admin secret" },
        { status: 401 },
      );
    }

    // 2. Generate a random 6-digit license key
    const newKey = Math.floor(100000 + Math.random() * 900000).toString();

    // 3. Save it to the database so it can be verified later
    const { error: dbError } = await supabaseAdmin
      .from("license_keys")
      .insert([{ pin_code: newKey, is_used: false }]);

    if (dbError) {
      console.error("Database Error:", dbError);
      return NextResponse.json(
        {
          error:
            "Failed to save key to database. Did you create the license_keys table?",
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, key: newKey });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
