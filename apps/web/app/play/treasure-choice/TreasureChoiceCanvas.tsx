"use client";

import { useEffect, useRef } from "react";
import { PLAY_STRINGS } from "../[code]/strings";
import { mountWithFallback } from "../mountGuard";
import { mountTreasureChoice, type TreasureChoiceHandle, type TreasureChoiceResult } from "@adhdcheck/game";

export default function TreasureChoiceCanvas({ onComplete }: { onComplete: (r: TreasureChoiceResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onComplete);
  useEffect(() => {
    cb.current = onComplete;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Dev query parameters (?seed=, ?choices=) only apply in development builds.
    const q = process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const seed = q.get("seed");
    const choices = q.get("choices");
    let handle: TreasureChoiceHandle | undefined;
    const cancel = mountWithFallback(
      el,
      mountTreasureChoice(el, {
      seed: seed ? Number(seed) : undefined,
      choices: choices ? Number(choices) : undefined,
      onComplete: (r) => cb.current(r),
    }),
      PLAY_STRINGS.unavailable,
      (h) => {
        handle = h;
      },
    );
    return () => {
      cancel();
      handle?.destroy();
    };
  }, []);

  return <div ref={ref} className="h-dvh w-full" />;
}
