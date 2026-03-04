import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  // This successfully destroys the secure HttpOnly cookie on the server
  await supabase.auth.signOut();

  return NextResponse.json({ success: true });
}
