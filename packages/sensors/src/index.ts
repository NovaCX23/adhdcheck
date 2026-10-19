import type { Device } from "@adhdcheck/contracts";

// STUB (Person 2 owns camera and microphone features, see research/06). Camera and microphone
// output never leaves the device; only the aggregates of the contract do (PC-04 is not applied yet).
// For now this builds the `device` block of SessionMetrics v1 from values the caller measured.
export type DeviceInput = {
  userAgent: string;
  pointerType: Device["pointer_type"];
  screenW: number;
  screenH: number;
  devicePixelRatio: number;
  estRefreshHz: number;
  crossOriginIsolated: boolean;
};

export function buildDeviceInfo(input: DeviceInput): Device {
  return {
    user_agent: input.userAgent,
    pointer_type: input.pointerType,
    screen_w: input.screenW,
    screen_h: input.screenH,
    device_pixel_ratio: input.devicePixelRatio,
    est_refresh_hz: input.estRefreshHz,
    cross_origin_isolated: input.crossOriginIsolated,
    timer_clock: "event.timeStamp",
  };
}
