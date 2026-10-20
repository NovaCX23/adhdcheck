import { createBrowserClient } from "@supabase/ssr";

// Supabase client for Client Components, acting as the logged-in parent (RLS applies).
// Only the public URL and publishable key reach the browser (NFR-10).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
