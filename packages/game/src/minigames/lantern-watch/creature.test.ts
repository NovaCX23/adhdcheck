import { describe, expect, it } from "vitest";
import { CreatureView } from "./creature";

// R3-L2: task.stimulus_ms is the time the firefly or moth is on screen. The creature must be gone in the frame
// that hides it, or a moth is visible longer than the declared 500 ms and taps are logged as "isi" while it shows.
describe("CreatureView", () => {
  it("shows a firefly for a go trial and a moth for a no-go trial", () => {
    const c = new CreatureView();
    c.show("go");
    expect(c.visible).toEqual({ moth: false, firefly: true });
    c.show("nogo");
    expect(c.visible).toEqual({ moth: true, firefly: false });
  });

  it("removes a moth in the same frame as the hide", () => {
    const c = new CreatureView();
    c.show("nogo");
    c.hide();
    expect(c.visible).toEqual({ moth: false, firefly: false });
  });

  it("removes a firefly nobody caught in the same frame as the hide", () => {
    const c = new CreatureView();
    c.show("go");
    c.hide();
    expect(c.visible).toEqual({ moth: false, firefly: false });
  });

  it("keeps a caught firefly in view while it flies to Luma, then removes it", () => {
    const c = new CreatureView();
    c.show("go");
    c.caught();
    c.hide();
    expect(c.visible.firefly).toBe(true);
    c.landed();
    expect(c.visible).toEqual({ moth: false, firefly: false });
  });

  it("a flying firefly does not stay visible beside the next moth", () => {
    const c = new CreatureView();
    c.show("go");
    c.caught();
    c.hide();
    c.show("nogo");
    expect(c.visible).toEqual({ moth: true, firefly: true });
    c.hide();
    expect(c.visible).toEqual({ moth: false, firefly: true });
  });
});
