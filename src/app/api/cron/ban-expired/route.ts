import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET(req: Request) {
  try {
    const today = new Date().toISOString();

    // 1. Find all active users whose expiration date is today or earlier
    const { data: expiredUsers, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .lte("access_expires_at", today)
      .eq("is_active", true);

    if (fetchError) throw fetchError;

    if (!expiredUsers || expiredUsers.length === 0) {
      return NextResponse.json({ message: "No expired users today" });
    }

    // 2. Suspend them
    for (const user of expiredUsers) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        ban_duration: "876000h",
      });
      await supabaseAdmin
        .from("profiles")
        .update({ is_active: false })
        .eq("id", user.id);
    }

    return NextResponse.json({
      success: true,
      bannedCount: expiredUsers.length,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
