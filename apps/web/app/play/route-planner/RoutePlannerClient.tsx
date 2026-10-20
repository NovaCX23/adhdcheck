"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import type { RoutePlannerResult } from "@adhdcheck/game";

// The game draws with the DOM, so it is never rendered on the server.
const RoutePlannerBoard = dynamic(() => import("./RoutePlannerBoard"), { ssr: false });

export function RoutePlannerClient() {
  const [result, setResult] = useState<RoutePlannerResult | null>(null);
  // Dev-only panel: NODE_ENV is inlined at build time, so this branch is removed from production builds.
  const showPanel = process.env.NODE_ENV === "development";
  return (
    <div className="fixed inset-0 bg-[#0a1030]">
      <RoutePlannerBoard onComplete={setResult} />
      {showPanel && result ? (
        <pre
          data-testid="route-planner-result"
          className="absolute inset-x-2 bottom-2 z-10 max-h-[40dvh] overflow-auto rounded bg-black/85 p-2 text-xs text-white"
        >
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
