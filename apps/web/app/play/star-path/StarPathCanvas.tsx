"use client";

import { useEffect, useRef } from "react";
import { PLAY_STRINGS } from "../[code]/strings";
import { mountWithFallback } from "../mountGuard";
import { mountStarPath, type StarPathHandle, type StarPathResult } from "@adhdcheck/game";

export default function StarPathCanvas({ onComplete }: { onComplete: (r: StarPathResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onComplete);
  useEffect(() => {
    cb.current = onComplete;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Dev query parameters (?seed=, ?max=) only apply in development builds.
    const q = process.env.NODE_ENV === "development" ? new URLSearchParams(window.location.search) : new URLSearchParams();
    const seed = q.get("seed");
    const max = q.get("max");
    let handle: StarPathHandle | undefined;
    const cancel = mountWithFallback(
      el,
      mountStarPath(el, {
      seed: seed ? Number(seed) : undefined,
      maxLength: max ? Number(max) : undefined,
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
