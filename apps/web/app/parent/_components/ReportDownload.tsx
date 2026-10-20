"use client";

import { useState } from "react";
import { S } from "../strings";
import { ErrorNote, buttonPrimary, buttonQuiet, postJson } from "./shell";

// D-05 (DECIDED, Hatem, 2026-10-20): downloading the report is the only paid feature. The paywall shows
// only here, and only after the server answers 402 (GET /api/reports/<id> checks the plan itself).
export function ReportDownload({ sessionId }: { sessionId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "paywall" | "failed">("idle");
  const [note, setNote] = useState<string | null>(null);

  async function download() {
    setState("busy");
    const res = await fetch(`/api/reports/${sessionId}`, { cache: "no-store" }).catch(() => null);
    if (res?.ok) {
      const name = /filename="([^"]+)"/.exec(res.headers.get("content-disposition") ?? "")?.[1] ?? "report.pdf";
      const url = URL.createObjectURL(await res.blob());
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 10_000);
      setState("idle");
    } else setState(res?.status === 402 ? "paywall" : "failed");
  }

  async function subscribe() {
    const res = await postJson("/api/stripe/checkout").catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { url?: string } | undefined;
    if (res?.ok && body?.url) window.location.assign(body.url);
    else setNote(S.billing.unavailable);
  }

  return (
    <div className="space-y-3">
      <button type="button" disabled={state === "busy"} onClick={download} className={buttonQuiet}>
        {state === "busy" ? S.report.preparing : S.report.download}
      </button>
      {state === "paywall" && (
        <div role="status" className="space-y-3 rounded-xl bg-cream-2 p-4">
          <p>{S.report.paywall}</p>
          <button type="button" onClick={subscribe} className={buttonPrimary}>
            {S.billing.subscribe}
          </button>
          {note && <p className="text-sm text-ink-muted">{note}</p>}
        </div>
      )}
      {state === "failed" && <ErrorNote />}
    </div>
  );
}
