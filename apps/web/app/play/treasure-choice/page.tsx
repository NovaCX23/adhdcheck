import { requireHarness } from "@/lib/game-harness";
import { TreasureChoiceClient } from "./TreasureChoiceClient";

export const metadata = { title: "ADHDCheck · Treasure Choice (dev)" };

export default function TreasureChoicePage() {
  requireHarness();
  return <TreasureChoiceClient />;
}
