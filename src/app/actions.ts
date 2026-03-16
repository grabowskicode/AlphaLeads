"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { redirect } from "next/navigation";

export async function logoutUser() {
  // 1. Next.js 15 safe cookie loading
  const cookieStore = await cookies();
  const supabase = createServerActionClient({ cookies: () => cookieStore });

  // 2. Shred the secure HttpOnly cookie permanently
  await supabase.auth.signOut();

  // 3. Force the server to redirect the user, bypassing all browser caches
  redirect("/login");
}
