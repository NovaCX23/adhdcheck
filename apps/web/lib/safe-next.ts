// Where a visitor goes after logging in. Only a path on this site is ever followed (never "//host", "/\host" or
// a full URL), and never the login page itself, so the redirect cannot be turned into an open redirect or a loop.

// Only a path on this site: "/x" yes; "//host", "/\host", "https://host" and "x" no.
export function safeNextPath(next: string | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/";
  return next;
}

// current: pathname plus query of the page that needs a login.
export function loginPathFor(current: string): string {
  const next = safeNextPath(current);
  if (next === "/" || next === "/login" || next.startsWith("/login?") || next.startsWith("/login/")) return "/login";
  return `/login?next=${encodeURIComponent(next)}`;
}

// search: the query string of the login page.
export function pathAfterLogin(search: string): string {
  const next = safeNextPath(new URLSearchParams(search).get("next"));
  if (next === "/" || next === "/login" || next.startsWith("/login?") || next.startsWith("/login/")) return "/parent";
  return next;
}
