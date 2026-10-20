import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

// Supabase client for Client Components, acting as the logged-in parent (RLS applies).
// Only the public URL and publishable key reach the browser (NFR-10).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}

// Same client, created on first use. Client Components are also rendered on the server at build time,
// where the variables may be absent; nothing touches the client during render, only in effects and handlers
// in the browser, so the real client is created there.
export function createLazyClient(): SupabaseClient {
  let real: SupabaseClient | undefined;
  const get = () => (real ??= createClient());
  return new Proxy({} as SupabaseClient, {
    get(_target, prop) {
      const client = get();
      const value = Reflect.get(client, prop, client);
      return typeof value === "function" ? value.bind(client) : value;
    },
  });
}
