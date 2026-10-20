import { describe, expect, it } from "vitest";
import { loginPathFor, pathAfterLogin, safeNextPath } from "./safe-next";

// R3-D1: the report email links to a page behind login. A visitor without a session is sent to /login and,
// once logged in, comes back to the page the link named.
const LINK = "/parent/00000000-0000-4000-8000-0000000000c1?session=3f2b8c1e-5a4d-4e6f-9b7a-1c2d3e4f5a6b";

describe("login redirect round trip", () => {
  it("sends an unauthenticated visit to /login carrying the page, and returns to it after login", () => {
    const login = loginPathFor(LINK);
    expect(login.startsWith("/login?next=")).toBe(true);
    expect(pathAfterLogin(new URL(login, "https://site.example.test").search)).toBe(LINK);
  });

  it("falls back to the parent page when there is no next, or when it is not a path on this site", () => {
    expect(pathAfterLogin("")).toBe("/parent");
    for (const bad of ["//evil.test", `/${String.fromCharCode(92)}evil.test`, "https://evil.test/parent", "parent", "/login", "/login?next=/parent"]) {
      expect(pathAfterLogin(`?next=${encodeURIComponent(bad)}`)).toBe("/parent");
    }
  });

  it("does not loop: asking for the login page itself gives the plain login path", () => {
    expect(loginPathFor("/login?next=%2Fparent")).toBe("/login");
  });
});

describe("safeNextPath", () => {
  it("keeps a path on this site and refuses the rest", () => {
    expect(safeNextPath("/parent/x?a=b")).toBe("/parent/x?a=b");
    expect(safeNextPath("//evil.test")).toBe("/");
    expect(safeNextPath(null)).toBe("/");
  });
});
