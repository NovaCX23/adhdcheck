import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Refreshes the parent's Supabase session cookie on each request (called from proxy.ts).
// It redirects no one: which pages need a login is decided by the pages (Person 4).
// Source: Supabase "Server-Side Auth for Next.js" guide and the Next.js with-supabase example.
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Without Supabase settings (a teammate running the app with no .env.local), pages still load.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // Nothing between createServerClient and getClaims(): getClaims() is what refreshes the session,
  // and the response returned below must be the one carrying the refreshed cookies.
  await supabase.auth.getClaims();

  return response;
}
