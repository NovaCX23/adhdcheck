"use client";

import { useEffect, useRef } from "react";
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
    let cancelled = false;
    let handle: RoutePlannerHandle | undefined;
    mountRoutePlanner(el, { onComplete: (r) => cb.current(r) }).then((h) => {
      if (cancelled) h.destroy();
      else handle = h;
    });
    return () => {
      cancelled = true;
      handle?.destroy();
    };
  }, []);

  return <div ref={ref} className="h-dvh w-full" />;
}
