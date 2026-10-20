import { requireHarness } from "@/lib/game-harness";
import { StarPathClient } from "./StarPathClient";

export const metadata = { title: "ADHDCheck · Star Path (dev)" };

export default function StarPathPage() {
  requireHarness();
  return <StarPathClient />;
}
