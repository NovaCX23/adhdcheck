import { afterEach, describe, expect, it, vi } from "vitest";
import type { EmailSender } from "../../../lib/email/sender";
import type { RateLimiter } from "../../../lib/rate-limit";
import { waitlistEmail } from "../../../lib/email/messages";
import { handleWaitlistPost, type WaitlistStore } from "./handler";

const EMAIL = "parent.synthetic@example.test";

function memoryStore() {
  const saved = new Map<string, string>();
  const store: WaitlistStore = {
    async add(email, lang) {
      if (!saved.has(email)) saved.set(email, lang);
    },
  };
  return { store, saved };
}

const allowAll: RateLimiter = { take: async () => true };
const quietEmail = (): EmailSender & { send: ReturnType<typeof vi.fn> } => ({ send: vi.fn().mockResolvedValue("sent") });

function post(
  body: unknown,
  { store = memoryStore().store, rateLimiter = allowAll, contentType = "application/json", email = quietEmail() as EmailSender } = {},
) {
  return handleWaitlistPost(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "content-type": contentType },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { store, rateLimiter, email },
  );
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/waitlist confirmation email (FR-50)", () => {
  it("sends a confirmation in the page language, once per address (idempotency key without the address)", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const email = quietEmail();
    await post({ email: "Parent.Synthetic@Example.TEST", lang: "ro" }, { email });

    expect(email.send).toHaveBeenCalledTimes(1);
    const sent = email.send.mock.calls[0][0];
    expect(sent.to).toBe(EMAIL);
    expect(sent.message.subject).toBe(waitlistEmail("ro").subject);
    expect(sent.idempotencyKey).toMatch(/^waitlist\/[0-9a-f]{64}$/);
    expect(sent.idempotencyKey).not.toContain("synthetic");
  });

  it("still answers ok when the email cannot be sent", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const email = { send: vi.fn().mockResolvedValue("failed") };
    const res = await post({ email: EMAIL, lang: "en" }, { email });
    expect(await res.json()).toEqual({ ok: true });
  });

  it("sends nothing when the address could not be stored", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const email = quietEmail();
    const failing: WaitlistStore = { add: async () => Promise.reject(new Error("down")) };
    await post({ email: EMAIL, lang: "en" }, { store: failing, email });
    expect(email.send).not.toHaveBeenCalled();
  });
});

describe("POST /api/waitlist", () => {
  it("stores the address (lower case) with its language and answers ok", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const res = await post({ email: "Parent.Synthetic@Example.TEST", lang: "en" }, { store });

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect([...saved]).toEqual([[EMAIL, "en"]]);
  });

  it("answers the same for an address already on the list, and stores it once", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const first = await post({ email: EMAIL, lang: "ro" }, { store });
    const second = await post({ email: EMAIL, lang: "ro" }, { store });

    expect(await second.json()).toEqual(await first.json());
    expect(saved.size).toBe(1);
  });

  it("rejects a language other than ro or en with 400 (was: defaulted to ro)", async () => {
    const { store, saved } = memoryStore();
    const res = await post({ email: EMAIL, lang: "xx" }, { store });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ ok: false });
    expect(saved.size).toBe(0);
  });

  it("rejects an unknown field with 400", async () => {
    const { store, saved } = memoryStore();
    const res = await post({ email: EMAIL, lang: "en", extra: 1 }, { store });
    expect(res.status).toBe(400);
    expect(saved.size).toBe(0);
  });

  it("never logs the email address", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await post({ email: EMAIL, lang: "en" });
    expect(res.status).toBe(200);
    const logged = JSON.stringify(log.mock.calls);
    expect(logged).not.toContain(EMAIL);
    expect(logged).not.toContain("example.test");
  });

  it("logs only the language and a timestamp", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    await post({ email: EMAIL, lang: "en" });
    expect(log).toHaveBeenCalledTimes(1);
    const payload = log.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(Object.keys(payload).sort()).toEqual(["at", "lang"]);
    expect(payload.lang).toBe("en");
  });

  it("rejects an invalid address with 400 and stores nothing", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    const res = await post({ email: "not-an-email" }, { store });
    expect(res.status).toBe(400);
    expect(log).not.toHaveBeenCalled();
    expect(saved.size).toBe(0);
  });

  it("refuses a body not sent as JSON (blocks cross-site form posts)", async () => {
    const { store, saved } = memoryStore();
    const res = await post(JSON.stringify({ email: EMAIL }), { store, contentType: "text/plain" });
    expect(res.status).toBe(415);
    expect(saved.size).toBe(0);
  });

  it("answers 429 above the rate limit and stores nothing (NFR-13)", async () => {
    const { store, saved } = memoryStore();
    const take = vi.fn().mockResolvedValue(false);
    const res = await post({ email: EMAIL }, { store, rateLimiter: { take } });

    expect(res.status).toBe(429);
    expect(take.mock.calls[0][0]).toMatch(/^waitlist:/);
    expect(saved.size).toBe(0);
  });

  it("answers 503 with ok false when storing fails, without logging the address", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const failing: WaitlistStore = {
      async add() {
        throw new Error(`insert failed for ${EMAIL}`);
      },
    };
    const res = await post({ email: EMAIL, lang: "ro" }, { store: failing });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
    expect(JSON.stringify(error.mock.calls)).not.toContain(EMAIL);
  });
});
