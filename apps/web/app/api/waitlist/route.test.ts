import { afterEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const EMAIL = "parent.synthetic@example.test";

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/waitlist", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

afterEach(() => vi.restoreAllMocks());

describe("POST /api/waitlist", () => {
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

  it("rejects an invalid address with 400", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const res = await post({ email: "not-an-email" });
    expect(res.status).toBe(400);
    expect(log).not.toHaveBeenCalled();
  });
});
