import { describe, expect, it } from "vitest";
import { reportView } from "./report-view";

// D-05b, R3-P1 and R3-P2: what the report block shows.
describe("reportView", () => {
  it("offers the report when there is no purchase", () => {
    expect(reportView(null, false, "no_flag")).toBe("offer");
  });
  it("shows the paid states for a paid purchase", () => {
    expect(reportView({ status: "paid", emailed_at: null }, false, "no_flag")).toBe("paid");
    expect(reportView({ status: "paid", emailed_at: "2026-10-20T10:00:00Z" }, false, "no_flag")).toBe("paid_emailed");
  });
  it("R3-P1 shows payment in progress, not the offer, while a pending purchase exists", () => {
    expect(reportView({ status: "pending", emailed_at: null }, false, "no_flag")).toBe("in_progress");
  });
  it("waits for the webhook right after checkout", () => {
    expect(reportView(null, true, "no_flag")).toBe("confirming");
  });
  it("R3-P2 hides the offer for a session with too little data", () => {
    expect(reportView(null, false, "insufficient_data")).toBe("none");
    expect(reportView(null, true, "insufficient_data")).toBe("none");
  });
  it("R3-P2 still shows a paid purchase made before the rule", () => {
    expect(reportView({ status: "paid", emailed_at: null }, false, "insufficient_data")).toBe("paid");
  });
});
