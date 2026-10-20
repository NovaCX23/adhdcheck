import { describe, expect, it, vi } from "vitest";
import { mountWithFallback, type MountTarget } from "./mountGuard";

function target(): MountTarget & { children: number } {
  const t = {
    children: 2,
    textContent: "",
    className: "",
    replaceChildren() {
      t.children = 0;
    },
  };
  return t;
}
const tick = () => new Promise((r) => setTimeout(r, 0));

describe("mountWithFallback", () => {
  it("shows the calm fallback and empties the container when the mount rejects", async () => {
    const unhandled = vi.fn();
    process.on("unhandledRejection", unhandled);
    const el = target();
    const onHandle = vi.fn();
    mountWithFallback(el, Promise.reject(new Error("webgl")), "FALLBACK", onHandle);
    await tick();
    process.off("unhandledRejection", unhandled);
    expect(el.children).toBe(0);
    expect(el.textContent).toBe("FALLBACK");
    expect(onHandle).not.toHaveBeenCalled();
    expect(unhandled).not.toHaveBeenCalled();
  });

  it("hands the handle over and leaves the container alone when the mount works", async () => {
    const el = target();
    const handle = { destroy: vi.fn() };
    const onHandle = vi.fn();
    mountWithFallback(el, Promise.resolve(handle), "FALLBACK", onHandle);
    await tick();
    expect(onHandle).toHaveBeenCalledWith(handle);
    expect(el.textContent).toBe("");
    expect(el.children).toBe(2);
  });

  it("destroys a handle that arrives after cancel, and shows nothing for a rejection after cancel", async () => {
    const el = target();
    const handle = { destroy: vi.fn() };
    const cancel = mountWithFallback(el, Promise.resolve(handle), "FALLBACK", vi.fn());
    cancel();
    await tick();
    expect(handle.destroy).toHaveBeenCalledTimes(1);
    const el2 = target();
    const cancel2 = mountWithFallback(el2, Promise.reject(new Error("x")), "FALLBACK", vi.fn());
    cancel2();
    await tick();
    expect(el2.textContent).toBe("");
  });
});
