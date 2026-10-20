import { afterEach, describe, expect, it, vi } from "vitest";
import type { RateLimiter } from "../../../lib/rate-limit";
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

function post(body: unknown, { store = memoryStore().store, rateLimiter = allowAll, contentType = "application/json" } = {}) {
  return handleWaitlistPost(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "content-type": contentType },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { store, rateLimiter },
  );
}

afterEach(() => vi.restoreAllMocks());

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

  it("defaults any other language to ro", async () => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    const { store, saved } = memoryStore();
    await post({ email: EMAIL, lang: "xx" }, { store });
    expect(saved.get(EMAIL)).toBe("ro");
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
    const res = await post({ email: EMAIL }, { store: failing });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ ok: false });
    expect(JSON.stringify(error.mock.calls)).not.toContain(EMAIL);
  });
});
