// Early-access sign-ups from the landing page.
// TODO: persist to Supabase (Frankfurt) table `waitlist` and send the confirmation via Resend
// (research/03-tech-stack.md, sections 1 and 7). Not persisted yet: the address is neither stored nor logged.

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
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

  console.log("[waitlist] signup received", { lang: lang === "en" ? "en" : "ro", at: new Date().toISOString() });
  return Response.json({ ok: true });
}
