// Lifecycle of the mounted game, with a minimal fake DOM (vitest runs in node). No tap is needed after
// the intro: every firefly that is not tapped falls asleep, so the game reaches its end by time alone.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mountWakeFireflies } from "./mount";

type Listener = (e: unknown) => void;

function fakeEnvironment() {
  const listeners = new Map<string, Listener>();
  const frames: Array<(t: number) => void> = [];
  const noop = () => undefined;
  const gradient = { addColorStop: noop };
  const texts: string[] = [];
  const ctx = new Proxy(
    {},
    {
      get: (_t, key) =>
        key === "fillText"
          ? (t: string) => texts.push(t)
          : key === "createRadialGradient" || key === "createLinearGradient"
          ? () => gradient
          : key === "measureText"
            ? () => ({ width: 10 })
            : noop,
      set: () => true,
    },
  );
  const canvas = {
    style: {} as Record<string, string>,
    width: 0,
    height: 0,
    setAttribute: noop,
    getContext: () => ctx,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }),
    addEventListener: (type: string, fn: Listener) => listeners.set(type, fn),
    removeEventListener: (type: string) => listeners.delete(type),
    remove: noop,
  };
  vi.stubGlobal("document", { createElement: () => canvas });
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  vi.stubGlobal("requestAnimationFrame", (fn: (t: number) => void) => frames.push(fn));
  vi.stubGlobal("cancelAnimationFrame", noop);
  vi.stubGlobal("window", {
    setTimeout: (fn: () => void, ms: number) => setTimeout(fn, ms),
    clearTimeout: (id: ReturnType<typeof setTimeout>) => clearTimeout(id),
    devicePixelRatio: 1,
  });
  const parent = { appendChild: noop } as unknown as HTMLElement;
  return {
    parent,
    // Every line of text drawn so far, joined: what the child could read.
    shown: () => texts.join(" "),
    // Default: on the Start button (centre x 400, y 252 of the 800 x 600 canvas, radius 54); (1, 1) is far from it.
    tap: (timeStamp: number, clientX = 400, clientY = 252) =>
      listeners.get("pointerdown")?.({ timeStamp, isPrimary: true, pointerType: "touch", button: 0, clientX, clientY }),
    // Runs queued animation frames up to the given time, 16 ms apart.
    runFrames(from: number, to: number) {
      for (let t = from; t <= to; t += 16) {
        const fn = frames.shift();
        if (!fn) break;
        fn(t);
      }
    },
  };
}

// The instructions stay on screen until the child taps (Hatem, 2026-10-21): the intro, the practice instruction and
// the sentence between practice and the measured block each wait for a tap. A tap away from a firefly does nothing
// during the trials, so a child who taps every 700 ms simulates "reads, then taps ready" without waking anything.
function playThrough(env: ReturnType<typeof fakeEnvironment>, from: number, seconds: number) {
  let t = from;
  for (const end = from + seconds * 1000; t < end; t += 700) {
    env.runFrames(t, t + 688);
    env.tap(t + 696);
  }
  return t;
}

describe("mountWakeFireflies instructions wait for a tap", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("does not move on by itself: 10 minutes of frames after the first tap, no second tap, no result", async () => {
    const env = fakeEnvironment();
    const onComplete = vi.fn();
    await mountWakeFireflies(env.parent, { seed: 7, trials: 1, onComplete });
    env.runFrames(0, 32);
    env.tap(40); // intro tap
    env.runFrames(48, 600_000);
    vi.advanceTimersByTime(60_000);
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("I3: a tap away from the Start button does not leave an instruction, a tap on it does", async () => {
    const env = fakeEnvironment();
    await mountWakeFireflies(env.parent, { seed: 7, trials: 1, onComplete: vi.fn() });
    env.runFrames(0, 32);
    env.tap(40, 1, 1); // away from the button
    env.runFrames(48, 2000);
    expect(env.shown()).not.toContain("When a firefly glows"); // still the first instruction
    env.tap(2010); // on the button
    env.runFrames(2016, 3000);
    expect(env.shown()).toContain("When a firefly glows");
  });

  it("finishes once when the child taps through the instructions", async () => {
    const env = fakeEnvironment();
    const onComplete = vi.fn();
    await mountWakeFireflies(env.parent, { seed: 7, trials: 1, onComplete });
    env.runFrames(0, 32);
    env.tap(40);
    playThrough(env, 48, 120);
    vi.advanceTimersByTime(10_000);
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});

describe("mountWakeFireflies lifecycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("never reports a result after it has been destroyed during the end hold", async () => {
    const env = fakeEnvironment();
    const onComplete = vi.fn();
    const handle = await mountWakeFireflies(env.parent, { seed: 7, trials: 1, onComplete });
    env.runFrames(0, 32);
    env.tap(40);
    playThrough(env, 48, 120);
    handle.destroy();
    vi.advanceTimersByTime(10_000);
    expect(onComplete).not.toHaveBeenCalled();
  });
});
