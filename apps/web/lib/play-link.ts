import { createHash, randomBytes } from "node:crypto";

// Play link (FR-01, FR-32): the short-lived, single-use session token the parent's QR code carries,
// so the child's device needs no login. The code is 32 random bytes (base64url, 43 characters);
// only its SHA-256 hash is stored (play_links table), so a database read cannot rebuild a link.
// The child's device sends the code back as `Authorization: Bearer <code>` with POST /api/sessions.

// TODO: lifetime not decided (docs/02 FR-01, "Token lifetime: TODO"). One hour is a placeholder that
// covers opening the link and playing one session.
export const PLAY_LINK_LIFETIME_MS = 60 * 60 * 1000;

const CODE = /^[A-Za-z0-9_-]{43}$/;

export function hashPlayCode(code: string): string {
  return createHash("sha256").update(code).digest("hex");
}

export function newPlayCode(): { code: string; codeHash: string } {
  const code = randomBytes(32).toString("base64url");
  return { code, codeHash: hashPlayCode(code) };
}

export function isPlayCode(value: unknown): value is string {
  return typeof value === "string" && CODE.test(value);
}

export function readBearerCode(request: Request): string | null {
  const match = /^Bearer (\S+)$/.exec(request.headers.get("authorization") ?? "");
  return match && isPlayCode(match[1]) ? match[1] : null;
}
