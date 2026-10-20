"use client";

import { useEffect, useRef } from "react";
import { PLAY_STRINGS } from "../[code]/strings";
import { mountWithFallback } from "../mountGuard";
import { mountRoutePlanner, type RoutePlannerHandle, type RoutePlannerResult } from "@adhdcheck/game";

export default function RoutePlannerBoard({ onComplete }: { onComplete: (r: RoutePlannerResult) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef(onComplete);
  useEffect(() => {
    cb.current = onComplete;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let handle: RoutePlannerHandle | undefined;
    const cancel = mountWithFallback(el, mountRoutePlanner(el, { onComplete: (r) => cb.current(r) }), PLAY_STRINGS.unavailable, (h) => {
      handle = h;
    });
    return () => {
      cancel();
      handle?.destroy();
    };
  }, []);

  return <div ref={ref} className="h-dvh w-full" />;
}
