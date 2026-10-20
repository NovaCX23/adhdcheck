import { SCORE_DISCLAIMER } from "@adhdcheck/contracts";
import { BAND_TEXT } from "../strings";

// A band headline in a list (child tile, earlier games) with the fixed disclaimer beside it (FR-33).
// Same weight for every band: no red, no green.
export function BandHeadline({ band }: { band: keyof typeof BAND_TEXT }) {
  return (
    <>
      <span className="font-semibold">{BAND_TEXT[band].headline}</span>
      <span className="mt-0.5 block text-xs font-normal text-ink-muted">{SCORE_DISCLAIMER}</span>
    </>
  );
}
