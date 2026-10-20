import { requireHarness } from "@/lib/game-harness";
import { BridgeWaitClient } from "./BridgeWaitClient";

export const metadata = { title: "ADHDCheck · Bridge Wait (dev)" };

export default function BridgeWaitPage() {
  requireHarness();
  return <BridgeWaitClient />;
}
