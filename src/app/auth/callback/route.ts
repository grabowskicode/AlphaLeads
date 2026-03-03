import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  // Default routing them to the update-password page on their first login
  const next = requestUrl.searchParams.get("next") ?? "/update-password";

  if (code) {
    // 1. Use auth-helpers-nextjs to match your middleware and layout
    const supabase = createRouteHandlerClient({ cookies });

    // 2. Securely exchange the 1-time link for a real, logged-in session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    }
  }

  // If they try to click an expired or used link, send them back to login
  return NextResponse.redirect(
    new URL("/login?error=Invalid+or+expired+link", requestUrl.origin),
  );
}
