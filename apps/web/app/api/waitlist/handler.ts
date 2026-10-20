import { clientKey, type RateLimiter } from "../../../lib/rate-limit";

// POST /api/waitlist: early-access sign-ups from the landing page (FR-42). Stores the address (lower case)
// and the page language; an address already listed gets the same answer and is stored once.
// The address is never logged (only language and time). Rate limited per client like /api/sessions.
// TODO: confirmation email via Resend (research/03-tech-stack.md, section 7).

export interface WaitlistStore {
  add(email: string, lang: "ro" | "en"): Promise<void>;
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function handleWaitlistPost(
  request: Request,
  deps: { store: WaitlistStore; rateLimiter: RateLimiter },
): Promise<Response> {
  const type = request.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) return Response.json({ ok: false }, { status: 415 });

  try {
    if (!(await deps.rateLimiter.take(clientKey(request, "waitlist")))) {
      return Response.json({ ok: false }, { status: 429 });
    }
  } catch {
    console.error("[waitlist] failed", { error: "storage_unavailable" });
    return Response.json({ ok: false }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }

  const { email, lang } = (body ?? {}) as { email?: unknown; lang?: unknown };
  if (typeof email !== "string" || email.length > 254 || !EMAIL.test(email)) {
    return Response.json({ ok: false }, { status: 400 });
  }
  const language = lang === "en" ? "en" : "ro";

  try {
    await deps.store.add(email.toLowerCase(), language);
  } catch {
    console.error("[waitlist] failed", { error: "storage_unavailable" });
    return Response.json({ ok: false }, { status: 503 });
  }

  console.log("[waitlist] signup received", { lang: language, at: new Date().toISOString() });
  return Response.json({ ok: true });
}
