import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/proxy", () => ({ updateSession: vi.fn() }));
const { config } = await import("./proxy");

// The matcher is a negative lookahead: a path is handled by the proxy when the pattern matches it.
const handled = (path: string) => new RegExp(`^${config.matcher[0]}$`).test(path);

describe("proxy matcher", () => {
  it("skips static images and audio files", () => {
    for (const path of ["/a.png", "/a.svg", "/sounds/cue.mp3"]) expect(handled(path)).toBe(false);
  });
  it("still handles pages", () => {
    expect(handled("/parent")).toBe(true);
  });
});
