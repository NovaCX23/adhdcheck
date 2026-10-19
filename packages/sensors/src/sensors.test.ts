import { describe, expect, it } from "vitest";
import { DeviceSchema } from "@adhdcheck/contracts";
import { buildDeviceInfo } from "./index";

describe("buildDeviceInfo (stub)", () => {
  it("returns a device block that satisfies the contract", () => {
    const device = buildDeviceInfo({
      userAgent: "synthetic-test-agent",
      pointerType: "touch",
      screenW: 1024,
      screenH: 768,
      devicePixelRatio: 2,
      estRefreshHz: 60,
      crossOriginIsolated: false,
    });
    expect(DeviceSchema.safeParse(device).success).toBe(true);
    expect(device.timer_clock).toBe("event.timeStamp");
  });
});
