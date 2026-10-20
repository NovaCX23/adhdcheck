import { readdirSync, readFileSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

// FR-70: no getUserMedia call happens before the parent switches a sensor on. The parent's choice reaches
// the game as `consent` (app/play/[code]/game.ts); camera and microphone capture belongs in packages/sensors
// (FR-71, FR-72), which the game calls with that choice. This test keeps every other file from asking for
// the camera or microphone directly, so the choice cannot be bypassed.

const REPO = join(__dirname, "..", "..", "..");
const ALLOWED = /^packages\/sensors\//;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) return [];
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|js|mjs)$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) ? [path] : [];
  });
}

export function capturingFiles(files: { path: string; text: string }[]): string[] {
  return files.filter((f) => /getUserMedia|getDisplayMedia/.test(f.text) && !ALLOWED.test(f.path)).map((f) => f.path);
}

describe("camera and microphone only through the consent-gated sensors package (FR-70)", () => {
  it("no file in apps/web or packages asks for the camera or microphone outside packages/sensors", () => {
    const files = [join(REPO, "apps", "web"), join(REPO, "packages")].flatMap(sourceFiles).map((path) => ({
      path: relative(REPO, path).split(sep).join("/"),
      text: readFileSync(path, "utf8"),
    }));
    expect(files.length).toBeGreaterThan(20); // the scan really ran
    expect(capturingFiles(files)).toEqual([]);
  });

  it("flags a direct call anywhere else, and allows packages/sensors", () => {
    const call = "navigator.mediaDevices.getUserMedia({ audio: true })";
    expect(
      capturingFiles([
        { path: "packages/game/src/minigames/x/scene.ts", text: call },
        { path: "apps/web/app/play/[code]/PlayLinkClient.tsx", text: call },
        { path: "packages/sensors/src/microphone.ts", text: call },
      ]),
    ).toEqual(["packages/game/src/minigames/x/scene.ts", "apps/web/app/play/[code]/PlayLinkClient.tsx"]);
  });
});
