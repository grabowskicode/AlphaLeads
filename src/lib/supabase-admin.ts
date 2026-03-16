import { createClient } from "@supabase/supabase-js";

// This uses the SERVICE_ROLE_KEY, so it must NEVER be used in client-side components.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);
