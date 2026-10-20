import { describe, expect, it } from "vitest";
import { PLAY_STRINGS } from "./strings";
import { sessionGame } from "./game";

describe("sessionGame (the game a play link runs)", () => {
  it("is wired to Lantern Watch, so the page no longer shows the 'not ready' screen", () => {
    expect(sessionGame).not.toBeNull();
  });

  it("shows the calm fallback and records nothing when the 3D game cannot mount (no DOM, no WebGL here)", async () => {
    const el = { textContent: "" as string | null, className: "absolute inset-0", replaceChildren() {} };
    let settled = false;
    void sessionGame?.(el as unknown as HTMLElement, "7d9e0a1b-2c3d-4e5f-8a9b-0c1d2e3f4a5b", { camera: false, microphone: false }).then(
      () => (settled = true),
      () => (settled = true),
    );
    // The game module (three.js) loads lazily; give it time, then give the promise a chance to settle.
    for (let k = 0; k < 100 && el.textContent !== PLAY_STRINGS.unavailable; k++) await new Promise((r) => setTimeout(r, 50));
    await new Promise((r) => setTimeout(r, 100));
    expect(el.textContent).toBe(PLAY_STRINGS.unavailable);
    expect(settled).toBe(false); // no SessionMetrics, so the flow never uploads anything
  });
});
