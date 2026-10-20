import { requireHarness } from "@/lib/game-harness";
import { RoutePlannerClient } from "./RoutePlannerClient";

export const metadata = { title: "ADHDCheck · Route Planner (dev)" };

export default function RoutePlannerPage() {
  requireHarness();
  return <RoutePlannerClient />;
}
