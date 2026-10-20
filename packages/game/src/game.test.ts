import { describe, expect, it } from "vitest";
import { mountGame } from "./index";

describe("mountGame", () => {
  it("is exported as a function and importing the package does not load Phaser", () => {
    expect(typeof mountGame).toBe("function");
    expect(typeof (globalThis as { window?: unknown }).window).toBe("undefined");
  });
});
