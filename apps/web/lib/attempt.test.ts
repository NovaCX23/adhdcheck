import { describe, expect, it } from "vitest";
import { attempt } from "./attempt";

describe("attempt", () => {
  it("answers ok with the value when the action works", async () => {
    expect(await attempt(async () => 3)).toEqual({ ok: true, value: 3 });
  });

  it("answers not ok instead of throwing when the action fails", async () => {
    expect(await attempt(async () => Promise.reject(new Error("write failed")))).toEqual({ ok: false });
  });
});
