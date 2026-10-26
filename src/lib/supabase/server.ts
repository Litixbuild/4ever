import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabasePublicKey, supabaseUrl } from "@/lib/env";

// Supabase client for server components, server actions and route handlers.
// It acts as the logged-in visitor, so the database security rules apply.
export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(supabaseUrl(), supabasePublicKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a server component, where cookies are read-only.
          // The proxy keeps sessions fresh, so this is safe to ignore.
        }
      },
    },
  });
}
