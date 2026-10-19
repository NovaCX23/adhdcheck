import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Supabase client for Server Components, Server Actions and Route Handlers, acting as the
// logged-in parent (publishable key + session cookie, so RLS applies).
// Source: Supabase "Server-Side Auth for Next.js" guide and the Next.js with-supabase example.
// Create a new client in each request; never keep one in a module variable.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component, which cannot set cookies. Safe to ignore:
          // proxy.ts refreshes the session on every request.
        }
      },
    },
  });
}
