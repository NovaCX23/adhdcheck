import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildUi as bridge } from "./minigames/bridge-wait/ui";
import { buildUi as lantern } from "./minigames/lantern-watch/ui";
import { buildUi as route } from "./minigames/route-planner/ui";
import { buildUi as star } from "./minigames/star-path/ui";
import { buildUi as treasure } from "./minigames/treasure-choice/ui";

// Review I-A: after an accepted Start tap the button must disappear at once. `.wait` (greyed, "not yet enabled") used to be
// added on top of `.off` (hidden) and its opacity won, leaving a ghost button for ~1.8 s. The classes are now exclusive:
// off wins, wait only shows while the button is visible.
function fakeDom() {
  const made: FakeNode[] = [];
  class FakeNode {
    className = "";
    textContent = "";
    innerHTML = "";
    offsetWidth = 100;
    clientWidth = 400;
    style: Record<string, string> = {};
    private classes = new Set<string>();
    classList = {
      toggle: (c: string, force?: boolean) => {
        const on = force ?? !this.classes.has(c);
        if (on) this.classes.add(c);
        else this.classes.delete(c);
        return on;
      },
      add: (c: string) => void this.classes.add(c),
      remove: (c: string) => void this.classes.delete(c),
      contains: (c: string) => this.classes.has(c),
    };
    append() {}
    appendChild() {}
    addEventListener() {}
    setAttribute() {}
    remove() {}
    getBoundingClientRect() {
      return { left: 0, top: 0, right: 128, bottom: 128, width: 128, height: 128 };
    }
  }
  vi.stubGlobal("document", {
    createElement: () => {
      const n = new FakeNode();
      made.push(n);
      return n;
    },
  });
  return made;
}

describe.each([
  ["lantern-watch", lantern, "lw"],
  ["star-path", star, "sp"],
  ["bridge-wait", bridge, "bw"],
  ["route-planner", route, "rp"],
  ["treasure-choice", treasure, "tc"],
] as const)("%s Start button", (_name, buildUi, prefix) => {
  beforeEach(() => void 0);
  afterEach(() => vi.unstubAllGlobals());

  function setup() {
    const made = fakeDom();
    const ui = buildUi({ append() {} } as unknown as HTMLElement);
    const play = made.find((n) => n.className === `${prefix}-play`)!;
    return { ui, has: (c: string) => play.classList.contains(c) };
  }

  it("before it is enabled it is visible and greyed (wait, not off)", () => {
    const { ui, has } = setup();
    ui.play(true);
    ui.playEnabled(false);
    expect([has("wait"), has("off")]).toEqual([true, false]);
  });

  it("when enabled it is plain", () => {
    const { ui, has } = setup();
    ui.play(true);
    ui.playEnabled(false);
    ui.playEnabled(true);
    expect([has("wait"), has("off")]).toEqual([false, false]);
  });

  it("after an accepted tap (play(false)) it is off and NOT wait, and the next frame's playEnabled(false) does not bring wait back", () => {
    const { ui, has } = setup();
    ui.play(true);
    ui.playEnabled(true);
    ui.play(false); // the scene hides the button at the accepted tap
    expect([has("off"), has("wait")]).toEqual([true, false]);
    ui.playEnabled(false); // the next frame: canReady is false once the tap was accepted
    expect([has("off"), has("wait")]).toEqual([true, false]);
  });

  it("a hidden button does not take a tap, a visible one does", () => {
    const { ui } = setup();
    ui.play(true);
    expect(ui.playHit(10, 10)).toBe(true);
    ui.play(false);
    expect(ui.playHit(10, 10)).toBe(false);
  });
});
