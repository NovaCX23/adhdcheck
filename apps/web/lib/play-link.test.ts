import { describe, expect, it } from "vitest";
import { hashPlayCode, isPlayCode, newPlayCode, readBearerCode } from "./play-link";

describe("play link codes (FR-01)", () => {
  it("makes a new random code each time, with its SHA-256 hash", () => {
    const a = newPlayCode();
    const b = newPlayCode();

    expect(isPlayCode(a.code)).toBe(true);
    expect(a.code).not.toBe(b.code);
    expect(a.codeHash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.codeHash).toBe(hashPlayCode(a.code));
    expect(a.codeHash).not.toContain(a.code);
  });

  it.each([["short"], ["a".repeat(44)], ["a".repeat(42) + "!"], [""], [null], [42]])("refuses %s as a code", (value) => {
    expect(isPlayCode(value)).toBe(false);
  });

  it("reads the code from an Authorization: Bearer header", () => {
    const { code } = newPlayCode();
    const request = new Request("http://localhost/api/sessions", { headers: { authorization: `Bearer ${code}` } });
    expect(readBearerCode(request)).toBe(code);
  });

  it.each([[undefined], ["Basic abc"], ["Bearer "], ["Bearer not-a-code"]])("reads no code from header %s", (header) => {
    const headers: Record<string, string> = header === undefined ? {} : { authorization: header };
    expect(readBearerCode(new Request("http://localhost/api/sessions", { headers }))).toBeNull();
  });
});
