import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// NFR-10 and NFR-12, checked on every test run instead of by a code search before each merge:
// only the Supabase URL and publishable key may be NEXT_PUBLIC_ (they reach the browser), and every other
// environment variable (service-role key, Stripe and Resend keys) is read only in server code: an API
// route, or a module that imports "server-only" (the build then fails if a Client Component imports it).

const ROOT = join(__dirname, "..");
const PUBLIC_ALLOWED = new Set(["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"]);

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

export function envUses(files: { path: string; text: string }[]) {
  return files.flatMap(({ path, text }) =>
    [...text.matchAll(/process\.env\.([A-Z0-9_]+)|process\.env\[["']([A-Z0-9_]+)["']\]/g)].map((m) => ({
      path,
      name: (m[1] ?? m[2]) as string,
      client: /^\s*["']use client["']/m.test(text),
      serverOnly: /^import ["']server-only["'];?/m.test(text) || /^app\/api\//.test(path),
    })),
  );
}

// NODE_ENV is not a secret: Next.js replaces it with a literal at build time.
const ALWAYS_ALLOWED = new Set(["NODE_ENV"]);

export function violations(files: { path: string; text: string }[]): string[] {
  return envUses(files).flatMap((use) => {
    if (ALWAYS_ALLOWED.has(use.name)) return [];
    if (use.name.startsWith("NEXT_PUBLIC_"))
      return PUBLIC_ALLOWED.has(use.name) ? [] : [`${use.path}: ${use.name} would reach the browser`];
    if (use.client || !use.serverOnly) return [`${use.path}: ${use.name} read outside server-only code`];
    return [];
  });
}

const files = sourceFiles(ROOT).map((path) => ({
  path: relative(ROOT, path).split(sep).join("/"),
  text: readFileSync(path, "utf8"),
}));

describe("environment variables stay on the server (NFR-10, NFR-12)", () => {
  it("finds the variables the app reads (the scan works)", () => {
    const names = new Set(envUses(files).map((u) => u.name));
    expect(names).toContain("SUPABASE_SERVICE_ROLE_KEY"); // check-secrets: allow
    expect(names).toContain("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("has no violation in apps/web", () => {
    expect(violations(files)).toEqual([]);
  });

  it("flags a secret read in a Client Component, in a plain module, and an extra public variable", () => { // check-secrets: allow
    const bad = [
      { path: "app/x/Page.tsx", text: `"use client";\nconst k = process.env.STRIPE_SECRET_KEY;` }, // check-secrets: allow
      { path: "lib/helper.ts", text: `export const k = process.env["SUPABASE_SERVICE_ROLE_KEY"];` }, // check-secrets: allow
      { path: "lib/flags.ts", text: `export const f = process.env.NEXT_PUBLIC_STRIPE_PRICE;` },
      { path: "lib/ok.ts", text: `import "server-only";\nexport const k = process.env.RESEND_API_KEY;` }, // check-secrets: allow
    ];
    expect(violations(bad)).toEqual([
      "app/x/Page.tsx: STRIPE_SECRET_KEY read outside server-only code", // check-secrets: allow
      "lib/helper.ts: SUPABASE_SERVICE_ROLE_KEY read outside server-only code", // check-secrets: allow
      "lib/flags.ts: NEXT_PUBLIC_STRIPE_PRICE would reach the browser",
    ]);
  });

  it("allows NODE_ENV in a Client Component while a secret in the same file is still flagged", () => { // check-secrets: allow
    const text = `"use client"; const dev = process.env.NODE_ENV; const k = process.env.STRIPE_SECRET_KEY;`; // check-secrets: allow
    expect(violations([{ path: "app/play/x/Client.tsx", text }])).toEqual([
      "app/play/x/Client.tsx: STRIPE_SECRET_KEY read outside server-only code", // check-secrets: allow
    ]);
  });
});
