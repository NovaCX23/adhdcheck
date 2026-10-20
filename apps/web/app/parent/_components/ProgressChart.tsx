import type { SessionResult } from "@/lib/data/parent";
import { S } from "../strings";
import { formatDate } from "./ResultCard";

// FR-38 progress: two game measures across this child's scored sessions, as plain SVG lines. Each point
// carries its device (NFR-24) and the note says sessions on different devices are not comparable.
// Sessions without enough data are left out of the lines.

const W = 640;
const H = 200;
const PAD = { l: 8, r: 8, t: 16, b: 28 };

type Series = { key: "commission_rate" | "omission_rate"; label: string; color: string; dash?: string };
const SERIES: Series[] = [
  { key: "commission_rate", label: S.indicator.commission_rate, color: "var(--night-3)" },
  { key: "omission_rate", label: S.indicator.omission_rate, color: "var(--glow-strong)", dash: "6 5" },
];

function device(ua: string, pointer: string) {
  const name = /iPad|Tablet|Android(?!.*Mobile)/i.test(ua) ? "tablet" : /Mobile|iPhone/i.test(ua) ? "phone" : "computer";
  return `${name}, ${pointer || "touch"}`;
}

export function ProgressChart({ results, missionsDone }: { results: SessionResult[]; missionsDone: number }) {
  const scored = results.filter((r) => r.score && r.score.band !== "insufficient_data");
  if (scored.length < 2) return <p className="text-ink-muted">{S.progress.empty}</p>;

  const max = Math.max(0.1, ...scored.flatMap((r) => SERIES.map((s) => r.score?.indicators[s.key] ?? 0))) * 1.15;
  const x = (i: number) => PAD.l + (i * (W - PAD.l - PAD.r)) / (scored.length - 1);
  const y = (v: number) => PAD.t + (1 - v / max) * (H - PAD.t - PAD.b);
  const devices = new Set(scored.map((r) => device(r.device.user_agent, r.device.pointer_type)));

  return (
    <figure>
      <div className="mb-3 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {SERIES.map((s) => (
          <span key={s.key} className="flex items-center gap-2">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="22" y2="3" stroke={s.color} strokeWidth="3" strokeDasharray={s.dash} />
            </svg>
            {s.label}
          </span>
        ))}
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={S.progress.title}>
        <line x1={PAD.l} x2={W - PAD.r} y1={H - PAD.b} y2={H - PAD.b} stroke="currentColor" strokeOpacity="0.15" />
        {SERIES.map((s) => (
          <g key={s.key}>
            <polyline
              fill="none"
              stroke={s.color}
              strokeWidth="3"
              strokeLinejoin="round"
              strokeDasharray={s.dash}
              points={scored.map((r, i) => `${x(i)},${y(r.score?.indicators[s.key] ?? 0)}`).join(" ")}
            />
            {scored.map((r, i) => (
              <circle key={r.session_id} cx={x(i)} cy={y(r.score?.indicators[s.key] ?? 0)} r="4" fill={s.color}>
                <title>
                  {formatDate(r.started_at)}, {device(r.device.user_agent, r.device.pointer_type)}: {s.label}{" "}
                  {Math.round((r.score?.indicators[s.key] ?? 0) * 100)}%
                </title>
              </circle>
            ))}
          </g>
        ))}
        <text x={PAD.l} y={H - 8} fontSize="12" fill="currentColor" opacity="0.6">
          {formatDate(scored[0]!.started_at)}
        </text>
        <text x={W - PAD.r} y={H - 8} fontSize="12" fill="currentColor" opacity="0.6" textAnchor="end">
          {formatDate(scored.at(-1)!.started_at)}
        </text>
      </svg>
      <figcaption className="mt-3 space-y-1 text-sm text-ink-muted">
        <p>
          {missionsDone} {S.progress.missionsDone}
        </p>
        {devices.size > 0 && <p>{S.progress.devices}</p>}
      </figcaption>
    </figure>
  );
}
