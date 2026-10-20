"use client";

import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { attempt } from "@/lib/attempt";
import { isPaidStatus } from "@/lib/paid";
import {
  birthYearRange,
  createChild,
  getSubscriptionStatus,
  listChildren,
  listSessionResults,
  MAX_NICKNAME_LENGTH,
  type Child,
} from "@/lib/data/parent";
import { BAND_TEXT, S } from "./strings";
import { ErrorNote, Loading, Panel, Shell, buttonPrimary, buttonQuiet, field, postJson, useParent } from "./_components/shell";
import { BandHeadline } from "./_components/BandHeadline";
import { formatDate } from "./_components/ResultCard";

type Row = Child & { last: { band: keyof typeof BAND_TEXT; at: string } | null };

async function fetchRows(client: SupabaseClient): Promise<Row[]> {
  const children = await listChildren(client);
  return Promise.all(
    children.map(async (c) => {
      const last = (await listSessionResults(client, c.id)).filter((r) => r.score).at(-1);
      return { ...c, last: last?.score ? { band: last.score.band, at: last.started_at } : null };
    }),
  );
}

// The parent's home (FR-31): their children with the last result, add a child (nickname and birth year
// only), the demo reset (FR-56) and, for a paying parent only, managing the plan (FR-46, D-05).
export function ParentHome() {
  const { client, ready } = useParent();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [plan, setPlan] = useState<string | null | undefined>(undefined);

  const load = useCallback(
    () =>
      fetchRows(client).then(
        (r) => setRows(r),
        () => setFailed(true),
      ),
    [client],
  );

  useEffect(() => {
    if (!ready) return;
    fetchRows(client).then(
      (r) => setRows(r),
      () => setFailed(true),
    );
    void fetch("/api/demo", { cache: "no-store" })
      .then((r) => r.json())
      .then((b: { is_demo?: boolean }) => setIsDemo(b.is_demo === true))
      .catch(() => {});
    void getSubscriptionStatus(client)
      .then(setPlan)
      .catch(() => setPlan(null));
  }, [ready, client]);

  if (!ready) return <Shell><Loading /></Shell>;

  return (
    <Shell>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-6">
          <h1 className="font-display text-3xl font-semibold">{S.home.title}</h1>
          {failed && <ErrorNote />}
          {!rows && !failed && <Loading />}
          {rows && rows.length === 0 && <p className="text-ink-muted">{S.home.empty}</p>}
          {rows && rows.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/parent/${c.id}`}
                    className="flex h-full flex-col gap-2 rounded-2xl bg-white p-5 shadow-[0_1px_0_rgb(31_27_58/0.06),0_8px_24px_rgb(31_27_58/0.06)] transition-shadow hover:shadow-[0_1px_0_rgb(31_27_58/0.06),0_12px_32px_rgb(31_27_58/0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink"
                  >
                    <span className="font-display text-2xl font-semibold">{c.nickname}</span>
                    <span className="text-sm text-ink-muted">{c.birth_year}</span>
                    <span className="mt-2 text-sm">
                      {c.last ? (
                        <>
                          <span className="text-ink-muted">
                            {S.home.lastResult}, {formatDate(c.last.at)}:
                          </span>{" "}
                          <BandHeadline band={c.last.band} />
                        </>
                      ) : (
                        <span className="text-ink-muted">{S.home.noResult}</span>
                      )}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Panel title={S.home.add}>
            <AddChild
              onAdd={async (input) => {
                await createChild(client, input);
                await load();
              }}
            />
          </Panel>
        </div>

        <aside className="space-y-6">
          {isDemo && (
            <Panel title={S.demo.label}>
              <DemoReset onDone={load} />
            </Panel>
          )}
          {/* D-05: no paywall here. The plan panel is only for a paying parent, to manage or cancel (FR-46). */}
          {isPaidStatus(plan ?? null) && (
            <Panel title={S.billing.title}>
              <Billing />
            </Panel>
          )}
        </aside>
      </div>
    </Shell>
  );
}

function AddChild({ onAdd }: { onAdd: (input: { nickname: string; birth_year: number }) => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const years = birthYearRange();
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_9rem_auto] sm:items-end"
      action={async (form) => {
        setBusy(true);
        setFailed(false);
        const done = await attempt(() =>
          onAdd({ nickname: String(form.get("nickname") ?? ""), birth_year: Number(form.get("birth_year")) }),
        );
        setFailed(!done.ok);
        setBusy(false);
      }}
    >
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{S.home.nickname}</span>
        <input name="nickname" required maxLength={MAX_NICKNAME_LENGTH} autoComplete="off" className={field} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold">{S.home.birthYear}</span>
        <input name="birth_year" type="number" required min={years.min} max={years.max} defaultValue={years.max - 2} className={field} />
      </label>
      <button type="submit" disabled={busy} className={buttonPrimary}>
        {S.home.add}
      </button>
      {failed && (
        <div className="sm:col-span-3">
          <ErrorNote />
        </div>
      )}
      <p className="text-sm text-ink-muted sm:col-span-3">{S.home.addHint}</p>
    </form>
  );
}

function DemoReset({ onDone }: { onDone: () => Promise<void> }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "failed">("idle");
  return (
    <div className="space-y-3">
      <button
        type="button"
        disabled={state === "busy"}
        className={buttonQuiet}
        onClick={async () => {
          setState("busy");
          const res = await postJson("/api/demo/reset").catch(() => null);
          if (res?.ok) await onDone();
          setState(res?.ok ? "done" : "failed");
        }}
      >
        {state === "busy" ? S.demo.resetting : S.demo.reset}
      </button>
      {state === "done" && <p role="status" className="text-sm text-ink-muted">{S.demo.done}</p>}
      {state === "failed" && <ErrorNote />}
    </div>
  );
}

// A paying parent manages or cancels the plan in the Stripe Customer Portal (FR-46). Subscribing starts
// from the report download (ReportDownload), the only paid feature (D-05).
function Billing() {
  const [note, setNote] = useState<string | null>(null);
  async function manage() {
    const res = await postJson("/api/stripe/portal").catch(() => null);
    const body = (await res?.json().catch(() => ({}))) as { url?: string } | undefined;
    if (res?.ok && body?.url) window.location.assign(body.url);
    else setNote(S.billing.unavailable);
  }
  return (
    <div className="space-y-3">
      <p className="text-ink-muted">{S.billing.active}</p>
      <button type="button" className={buttonQuiet} onClick={manage}>
        {S.billing.manage}
      </button>
      {note && <p role="status" className="text-sm text-ink-muted">{note}</p>}
    </div>
  );
}
