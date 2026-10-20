import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const { harnessEnabled } = await import("./game-harness");

describe("harnessEnabled (FR-01: dev harness pages are not shipped)", () => {
  it("is on in development", () => {
    expect(harnessEnabled({ NODE_ENV: "development" })).toBe(true);
  });
  it("is off in production", () => {
    expect(harnessEnabled({ NODE_ENV: "production" })).toBe(false);
    expect(harnessEnabled({ NODE_ENV: "production", GAME_HARNESS: "0" })).toBe(false);
    expect(harnessEnabled({ NODE_ENV: "production", GAME_HARNESS: "true" })).toBe(false);
  });
  it("is on in production with GAME_HARNESS=1", () => {
    expect(harnessEnabled({ NODE_ENV: "production", GAME_HARNESS: "1" })).toBe(true);
  });
});
