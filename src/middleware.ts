import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient(
    { req, res },
    {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // 1. Protected Routes: If user is NOT logged in, kick them to /login
  if (
    !session &&
    (req.nextUrl.pathname.startsWith("/dashboard") ||
      req.nextUrl.pathname.startsWith("/transactions") ||
      req.nextUrl.pathname.startsWith("/settings") ||
      req.nextUrl.pathname.startsWith("/leads"))
  ) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // 2. Public Routes: If user IS logged in, don't let them see /login again
  // EDIT: User requested access to login page even if logged in (to switch accounts etc)
  // if (session && req.nextUrl.pathname === '/login') {
  //   return NextResponse.redirect(new URL('/dashboard', req.url));
  // }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
};
