"use client";

import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import { content, type Dict, type Lang } from "../content";
import { Fireflies } from "./Fireflies";
import {
  Arrow, Book, Check, Clipboard, Cloud, Compass, Play, Plus, Puzzle, Scale, Shield,
} from "./icons";

const LANG_KEY = "adhdcheck.lang";

// Language lives in localStorage (with an in-memory fallback when storage is blocked).
// The server always renders Romanian; the client switches after hydration if needed.
const langListeners = new Set<() => void>();
let memLang: Lang | null = null;

function readLang(): Lang {
  if (memLang) return memLang;
  try {
    return localStorage.getItem(LANG_KEY) === "en" ? "en" : "ro";
  } catch {
    return "ro";
  }
}

function writeLang(l: Lang) {
  memLang = l;
  try {
    localStorage.setItem(LANG_KEY, l);
  } catch {}
  langListeners.forEach((f) => f());
}

function subscribeLang(cb: () => void) {
  langListeners.add(cb);
  return () => {
    langListeners.delete(cb);
  };
}

export function Landing() {
  const lang = useSyncExternalStore(subscribeLang, readLang, () => "ro" as Lang);
  const setLang = writeLang;
  const t = content[lang];

  useEffect(() => {
    document.documentElement.classList.add("js");
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  useReveal(lang);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-glow focus:px-4 focus:py-2 focus:text-on-glow"
      >
        {t.meta.skip}
      </a>
      <Header t={t} lang={lang} setLang={setLang} />
      <main id="main">
        <Hero t={t} />
        <Pain t={t} />
        <Cost t={t} />
        <Story t={t} />
        <How t={t} />
        <Game t={t} />
        <Result t={t} />
        <Science t={t} />
        <Offer t={t} />
        <Faq t={t} />
        <Final t={t} lang={lang} />
      </main>
      <Footer t={t} />
      <StickyCta t={t} />
    </>
  );
}

/* ---------- hooks ---------- */

// Re-runs on language change so any element React re-created is observed again.
function useReveal(lang: Lang) {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)");
    if (!("IntersectionObserver" in window)) {
      els.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [lang]);
}

/* ---------- shared bits ---------- */

function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

function Kicker({ children, dark = false }: { children: ReactNode; dark?: boolean }) {
  return (
    <p
      className={`mb-3 font-display text-sm font-semibold uppercase tracking-[0.14em] ${
        dark ? "text-glow" : "text-glow-strong"
      }`}
    >
      {children}
    </p>
  );
}

function CtaButton({ href = "#descarca", children, className = "" }: { href?: string; children: ReactNode; className?: string }) {
  return (
    <a
      href={href}
      className={`btn-glow inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full px-7 py-3 font-display text-lg font-semibold ${className}`}
    >
      {children}
      <Arrow className="size-5" />
    </a>
  );
}

/* ---------- header ---------- */

function Logo({ dark = true }: { dark?: boolean }) {
  return (
    <a href="#main" className="flex items-center gap-2" aria-label="ADHDCheck">
      <span className="relative grid size-8 place-items-center">
        <span className="absolute inset-0 rounded-full bg-glow/30 blur-md" />
        <span className="relative size-3 rounded-full bg-glow shadow-[0_0_14px_4px_rgb(251_191_36/0.7)]" />
      </span>
      <span className={`font-display text-xl font-bold tracking-tight ${dark ? "text-moon" : "text-ink"}`}>
        ADHD<span className="text-glow">Check</span>
      </span>
    </a>
  );
}

function LangToggle({ lang, setLang, label }: { lang: Lang; setLang: (l: Lang) => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex rounded-full border border-white/15 bg-white/5 p-1">
      {(["ro", "en"] as const).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          className={`min-h-9 min-w-10 cursor-pointer rounded-full px-3 text-sm font-bold uppercase transition-colors ${
            lang === l ? "bg-moon text-night" : "text-moon-muted hover:text-moon"
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Header({ t, lang, setLang }: { t: Dict; lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night/85 backdrop-blur-md">
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav aria-label="Main" className="hidden items-center gap-7 text-sm font-semibold text-moon-muted md:flex">
          <a className="hover:text-moon" href="#cum">{t.nav.how}</a>
          <a className="hover:text-moon" href="#joc">{t.nav.game}</a>
          <a className="hover:text-moon" href="#stiinta">{t.nav.science}</a>
          <a className="hover:text-moon" href="#intrebari">{t.nav.faq}</a>
        </nav>
        <div className="flex items-center gap-3">
          <LangToggle lang={lang} setLang={setLang} label={t.nav.langLabel} />
          <a
            href="/login"
            className="inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-2 text-sm font-semibold text-moon-muted hover:text-moon focus-visible:outline-2 focus-visible:outline-glow sm:px-3"
          >
            {t.nav.login}
          </a>
          <a
            href="#descarca"
            className="btn-glow hidden min-h-10 items-center rounded-full px-5 font-display text-sm font-semibold sm:inline-flex"
          >
            {t.nav.cta}
          </a>
        </div>
      </Container>
    </header>
  );
}

/* ---------- hero ---------- */

function Hero({ t }: { t: Dict }) {
  return (
    <section id="hero" className="relative overflow-hidden bg-night text-moon">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_20%,#24357a_0%,transparent_60%)]" />
      <Fireflies />
      <ForestSilhouette />
      <Container className="relative grid items-center gap-12 pb-24 pt-14 md:grid-cols-[1.1fr_0.9fr] md:pb-32 md:pt-20">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-glow/30 bg-glow/10 px-4 py-1.5 text-sm font-semibold text-glow">
            <span className="size-1.5 rounded-full bg-glow" />
            {t.hero.eyebrow}
          </p>
          <p className="mb-4 text-lg italic text-moon-muted md:text-xl">{t.hero.pre}</p>
          <h1 className="font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-moon-muted md:text-xl">{t.hero.sub}</p>
          <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
            <CtaButton>{t.hero.cta}</CtaButton>
            <a
              href="#cum"
              className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-full border-2 border-white/20 px-6 font-display font-semibold text-moon transition-colors hover:border-white/50"
            >
              <Play className="size-4" />
              {t.hero.secondary}
            </a>
          </div>
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold text-moon-muted">
            {t.hero.trust.map((x) => (
              <li key={x} className="flex items-center gap-2">
                <Check className="size-4 text-leaf" />
                {x}
              </li>
            ))}
          </ul>
        </div>
        <PhoneMock t={t} />
      </Container>
    </section>
  );
}

function ForestSilhouette() {
  return (
    <svg
      className="absolute bottom-0 left-0 h-28 w-full text-[#081024] md:h-40"
      viewBox="0 0 1440 160"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        fill="currentColor"
        d="M0 160V96l40-40 30 34 40-62 44 58 30-26 46 44 40-70 50 66 34-30 46 40 44-64 48 58 30-22 52 48 40-72 46 66 36-28 50 46 42-60 44 52 36-34 48 44 40-66 46 60 34-26 52 46 44-58 40 50 36-30 48 42 40-64 46 58 30-20 30 26v66Z"
      />
    </svg>
  );
}

function Luma({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true">
      <circle cx="40" cy="52" r="20" fill="#fde68a" opacity="0.35" />
      <ellipse cx="26" cy="30" rx="12" ry="8" fill="#c7d2fe" opacity="0.8" transform="rotate(-25 26 30)" />
      <ellipse cx="54" cy="30" rx="12" ry="8" fill="#c7d2fe" opacity="0.8" transform="rotate(25 54 30)" />
      <circle cx="40" cy="38" r="14" fill="#4c5fb8" />
      <circle cx="40" cy="54" r="12" fill="#fbbf24" />
      <circle cx="35" cy="36" r="3" fill="#fff" />
      <circle cx="45" cy="36" r="3" fill="#fff" />
      <circle cx="35.6" cy="36.6" r="1.4" fill="#0b1430" />
      <circle cx="45.6" cy="36.6" r="1.4" fill="#0b1430" />
      <path d="M36 43q4 3 8 0" stroke="#fff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <path d="M35 25q-3-7-7-8M45 25q3-7 7-8" stroke="#4c5fb8" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function PhoneMock({ t }: { t: Dict }) {
  return (
    <div className="float-soft relative mx-auto w-full max-w-[300px]">
      <div className="absolute -inset-10 rounded-full bg-glow/20 blur-3xl" aria-hidden="true" />
      <div
        role="img"
        aria-label={`${t.hero.phoneTitle}: ${t.hero.phoneHint}`}
        className="relative aspect-[9/18.5] rounded-[2.6rem] border-[6px] border-[#2a3770] bg-gradient-to-b from-[#16235a] to-[#0a1230] p-4 shadow-2xl"
      >
        <div className="mx-auto mb-4 h-1.5 w-16 rounded-full bg-white/20" />
        <div className="flex items-center justify-between text-xs font-bold text-moon-muted">
          <span className="font-display text-sm text-moon">{t.hero.phoneTitle}</span>
          <span className="flex gap-0.5 text-glow">★★<span className="text-white/25">★</span></span>
        </div>
        <div className="relative mt-4 h-[62%] overflow-hidden rounded-3xl bg-[radial-gradient(circle_at_50%_30%,#22337a,#0b1430_75%)]">
          {/* target firefly */}
          <span className="absolute left-[58%] top-[28%] grid size-14 place-items-center">
            <span className="pulse-ring absolute inset-0 rounded-full border-2 border-glow" />
            <span className="size-6 rounded-full bg-[#fde68a] shadow-[0_0_24px_10px_rgb(251_191_36/0.65)]" />
          </span>
          <span className="firefly" style={{ left: "20%", top: "60%" }} />
          <span className="firefly" style={{ left: "75%", top: "72%" }} />
          {/* moth (no-go) */}
          <svg className="absolute left-[16%] top-[22%] size-10 opacity-80" viewBox="0 0 40 40" aria-hidden="true">
            <ellipse cx="13" cy="18" rx="10" ry="7" fill="#8b7fa8" transform="rotate(-20 13 18)" />
            <ellipse cx="27" cy="18" rx="10" ry="7" fill="#8b7fa8" transform="rotate(20 27 18)" />
            <rect x="18.5" y="12" width="3" height="16" rx="1.5" fill="#5b4f78" />
          </svg>
          <svg className="absolute bottom-0 left-0 h-12 w-full text-[#060c20]" viewBox="0 0 300 50" preserveAspectRatio="none" aria-hidden="true">
            <path fill="currentColor" d="M0 50V30l20-18 18 16 22-24 24 22 18-12 26 20 22-28 26 26 20-14 24 18 20-22 24 20 16-10 20 14v32Z" />
          </svg>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Luma className="size-14 shrink-0" />
          <p className="rounded-2xl rounded-bl-sm bg-white/10 px-3 py-2 text-xs font-semibold leading-snug text-moon">
            {t.hero.phoneHint}
          </p>
        </div>
      </div>
    </div>
  );
}

/* ---------- pain ---------- */

function Pain({ t }: { t: Dict }) {
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container>
        <div className="reveal mx-auto max-w-3xl text-center">
          <Kicker>{t.pain.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.pain.title}</h2>
        </div>
        <ul className="mt-14 grid gap-5 md:grid-cols-2">
          {t.pain.items.map((item, i) => (
            <li key={i} className="reveal clay flex gap-4 p-6" style={{ transitionDelay: `${i * 50}ms` }}>
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-berry-soft text-berry">
                <Cloud className="size-5" />
              </span>
              <p className="text-lg leading-relaxed text-ink">{item}</p>
            </li>
          ))}
        </ul>
        <p className="reveal mx-auto mt-14 max-w-3xl text-center font-display text-2xl font-semibold leading-snug text-ink md:text-3xl">
          {t.pain.punch}
        </p>
      </Container>
    </section>
  );
}

/* ---------- cost of waiting ---------- */

function Cost({ t }: { t: Dict }) {
  return (
    <section className="relative overflow-hidden bg-night-2 py-20 text-moon md:py-28">
      <Fireflies count={6} />
      <Container className="relative">
        <div className="reveal max-w-3xl">
          <Kicker dark>{t.cost.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl">{t.cost.title}</h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {t.cost.stats.map((s, i) => (
            <figure
              key={i}
              className="reveal flex flex-col rounded-3xl border border-white/10 bg-white/[0.04] p-6"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <p className="font-display text-5xl font-bold tabular-nums text-glow">{s.value}</p>
              <p className="mt-4 flex-1 leading-relaxed text-moon">{s.label}</p>
              <figcaption className="mt-5 border-t border-white/10 pt-3 text-xs text-moon-muted">{s.source}</figcaption>
            </figure>
          ))}
        </div>
        <p className="reveal mt-14 max-w-3xl font-display text-2xl font-semibold leading-snug md:text-3xl">
          {t.cost.punch}
        </p>
      </Container>
    </section>
  );
}

/* ---------- story (epiphany bridge) ---------- */

function Story({ t }: { t: Dict }) {
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container className="grid items-center gap-12 md:grid-cols-[0.9fr_1.1fr]">
        <div className="reveal relative order-2 md:order-1">
          <div className="clay relative overflow-hidden bg-night p-8 text-moon md:p-10">
            <Fireflies count={5} />
            <Luma className="relative mx-auto size-32" />
            <blockquote className="relative mt-6 font-display text-2xl font-semibold leading-snug">
              “{t.story.quote}”
            </blockquote>
            <p className="relative mt-4 text-sm text-moon-muted">Ana</p>
          </div>
        </div>
        <div className="reveal order-1 md:order-2">
          <Kicker>{t.story.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.story.title}</h2>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-ink-muted">
            {t.story.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
          <p className="mt-6 text-sm italic text-ink-muted">{t.story.note}</p>
          <CtaButton className="mt-8">{t.hero.cta}</CtaButton>
        </div>
      </Container>
    </section>
  );
}

/* ---------- how it works ---------- */

function How({ t }: { t: Dict }) {
  const icons = [Play, Clipboard, Compass];
  return (
    <section id="cum" className="bg-white py-20 md:py-28">
      <Container>
        <div className="reveal mx-auto max-w-3xl text-center">
          <Kicker>{t.how.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.how.title}</h2>
        </div>
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {t.how.steps.map((s, i) => {
            const Icon = icons[i];
            return (
              <li key={i} className="reveal clay relative p-7" style={{ transitionDelay: `${i * 80}ms` }}>
                <span className="absolute -top-4 left-7 grid size-9 place-items-center rounded-full bg-night font-display text-lg font-bold text-glow">
                  {i + 1}
                </span>
                <span className="mt-2 grid size-12 place-items-center rounded-2xl bg-cream-2 text-glow-strong">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-1 text-sm font-bold uppercase tracking-wide text-glow-strong">{s.time}</p>
                <p className="mt-3 leading-relaxed text-ink-muted">{s.body}</p>
              </li>
            );
          })}
        </ol>
      </Container>
    </section>
  );
}

/* ---------- game ---------- */

function Game({ t }: { t: Dict }) {
  return (
    <section id="joc" className="relative overflow-hidden bg-night py-20 text-moon md:py-28">
      <Fireflies />
      <Container className="relative">
        <div className="reveal grid items-end gap-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-3xl">
            <Kicker dark>{t.game.kicker}</Kicker>
            <h2 className="font-display text-4xl font-bold leading-tight md:text-5xl">{t.game.title}</h2>
            <p className="mt-4 text-lg text-moon-muted">{t.game.sub}</p>
          </div>
          <Luma className="float-soft hidden size-36 md:block" />
        </div>
        <ol className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.game.missions.map((m, i) => (
            <li
              key={i}
              className="reveal group flex gap-4 rounded-3xl border border-white/10 bg-white/[0.04] p-6 transition-colors hover:border-glow/40 hover:bg-white/[0.07]"
              style={{ transitionDelay: `${i * 50}ms` }}
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-glow/15 font-display text-xl font-bold text-glow">
                {i}
              </span>
              <div>
                <h3 className="font-display text-xl font-semibold">{m.name}</h3>
                <p className="mt-1 leading-relaxed text-moon-muted">{m.what}</p>
              </div>
            </li>
          ))}
        </ol>
        <p className="reveal mt-10 flex max-w-3xl gap-3 rounded-2xl border border-glow/25 bg-glow/10 p-5 leading-relaxed text-moon">
          <Scale className="mt-0.5 size-6 shrink-0 text-glow" />
          {t.game.measure}
        </p>
      </Container>
    </section>
  );
}

/* ---------- result preview ---------- */

function Result({ t }: { t: Dict }) {
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container className="grid items-center gap-12 md:grid-cols-2">
        <div className="reveal">
          <Kicker>{t.result.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.result.title}</h2>
          <p className="mt-6 text-lg text-ink-muted">{t.result.sub}</p>
          <ul className="mt-6 space-y-3">
            <li className="flex items-start gap-3 rounded-2xl border-2 border-glow/60 bg-white p-4 font-semibold text-ink">
              <Compass className="mt-0.5 size-5 shrink-0 text-glow-strong" />
              {t.result.a}
            </li>
            <li className="flex items-start gap-3 rounded-2xl border-2 border-leaf/40 bg-white p-4 font-semibold text-ink">
              <Check className="mt-0.5 size-5 shrink-0 text-leaf" />
              {t.result.b}
            </li>
          </ul>
        </div>
        <div className="reveal">
          <div className="clay mx-auto max-w-md p-7">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-cream-2 px-3 py-1 text-xs font-bold uppercase tracking-wide text-ink-muted">
                {t.result.cardLabel}
              </span>
              <span className="text-sm font-semibold text-ink-muted">{t.result.child}</span>
            </div>
            <div className="mt-6 flex items-start gap-4 rounded-2xl bg-night p-5 text-moon">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-glow text-on-glow">
                <Compass className="size-6" />
              </span>
              <p className="font-display text-xl font-semibold leading-snug">{t.result.a}</p>
            </div>
            <p className="mt-6 text-sm font-bold text-ink">{t.result.reasonsTitle}</p>
            <ul className="mt-3 space-y-2">
              {t.result.reasons.map((r) => (
                <li key={r} className="flex gap-2 text-ink-muted">
                  <span className="mt-2 size-1.5 shrink-0 rounded-full bg-glow-strong" />
                  {r}
                </li>
              ))}
            </ul>
            <p className="mt-6 rounded-xl bg-cream px-4 py-3 text-sm font-semibold text-ink">{t.result.disclaimer}</p>
          </div>
        </div>
      </Container>
    </section>
  );
}

/* ---------- science + privacy ---------- */

function Science({ t }: { t: Dict }) {
  const icons = [Book, Scale, Puzzle];
  return (
    <section id="stiinta" className="bg-white py-20 md:py-28">
      <Container>
        <div className="reveal max-w-3xl">
          <Kicker>{t.science.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.science.title}</h2>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {t.science.items.map((it, i) => {
            const Icon = icons[i];
            return (
              <article key={i} className="reveal clay p-7" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="grid size-12 place-items-center rounded-2xl bg-cream-2 text-glow-strong">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{it.title}</h3>
                <p className="mt-3 leading-relaxed text-ink-muted">{it.body}</p>
              </article>
            );
          })}
        </div>
        <div className="reveal mt-8 rounded-[1.75rem] bg-night p-7 text-moon md:p-9">
          <div className="flex items-center gap-3">
            <Shield className="size-7 text-leaf" />
            <h3 className="font-display text-2xl font-semibold">{t.science.privacy.title}</h3>
          </div>
          <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {t.science.privacy.items.map((p) => (
              <li key={p} className="flex items-center gap-2 rounded-2xl bg-white/5 px-4 py-3 font-semibold">
                <Check className="size-5 shrink-0 text-leaf" />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}

/* ---------- offer (value stack) ---------- */

function Offer({ t }: { t: Dict }) {
  return (
    <section className="bg-cream py-20 md:py-28">
      <Container>
        <div className="reveal mx-auto max-w-3xl text-center">
          <Kicker>{t.offer.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.offer.title}</h2>
        </div>
        <div className="reveal clay mx-auto mt-14 max-w-2xl overflow-hidden p-0">
          <ul className="divide-y-2 divide-cream-2">
            {t.offer.items.map((it) => (
              <li key={it.name} className="flex items-center gap-4 px-6 py-5 md:px-8">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-leaf-soft text-leaf">
                  <Check className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="font-display text-lg font-semibold text-ink">{it.name}</p>
                  <p className="text-sm text-ink-muted">{it.detail}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="bg-night px-6 py-8 text-center text-moon md:px-8">
            <p className="text-sm font-bold uppercase tracking-[0.14em] text-moon-muted">{t.offer.priceLabel}</p>
            <p className="mt-1 font-display text-6xl font-bold text-glow">{t.offer.price}</p>
            <p className="mt-1 text-moon-muted">{t.offer.priceNote}</p>
            <CtaButton className="mt-6 w-full sm:w-auto">{t.offer.cta}</CtaButton>
          </div>
        </div>
        <p className="reveal mx-auto mt-8 flex max-w-2xl items-start gap-3 text-ink-muted">
          <Shield className="mt-0.5 size-6 shrink-0 text-leaf" />
          {t.offer.guarantee}
        </p>
      </Container>
    </section>
  );
}

/* ---------- FAQ ---------- */

function Faq({ t }: { t: Dict }) {
  return (
    <section id="intrebari" className="bg-white py-20 md:py-28">
      <Container className="max-w-3xl">
        <div className="reveal text-center">
          <Kicker>{t.faq.kicker}</Kicker>
          <h2 className="font-display text-4xl font-bold leading-tight text-ink md:text-5xl">{t.faq.title}</h2>
        </div>
        <div className="mt-12 space-y-4">
          {t.faq.items.map((f, i) => (
            <details key={i} className="reveal clay group p-0 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-display text-lg font-semibold text-ink">
                {f.q}
                <Plus className="size-5 shrink-0 text-glow-strong transition-transform group-open:rotate-45" />
              </summary>
              <p className="px-6 pb-6 leading-relaxed text-ink-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </Container>
    </section>
  );
}

/* ---------- final CTA + waitlist ---------- */

function Final({ t, lang }: { t: Dict; lang: Lang }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "ok" | "invalid" | "fail">("idle");

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState("invalid");
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, lang }),
      });
      setState(res.ok ? "ok" : res.status === 400 ? "invalid" : "fail");
    } catch {
      setState("fail");
    }
  }

  const msg =
    state === "ok" ? t.final.formSuccess : state === "invalid" ? t.final.formError : state === "fail" ? t.final.formFail : null;

  return (
    <section id="descarca" className="relative overflow-hidden bg-night py-20 text-moon md:py-28">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#24357a_0%,transparent_65%)]" />
      <Fireflies />
      <Container className="relative max-w-3xl text-center">
        <Luma className="float-soft mx-auto size-28" />
        <h2 className="mt-6 font-display text-4xl font-bold leading-tight md:text-6xl">{t.final.title}</h2>
        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-moon-muted">{t.final.sub}</p>

        <p className="mx-auto mt-8 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-sm font-semibold text-moon">
          <Check className="size-4 text-leaf" />
          {t.final.browserNote}
        </p>

        {state === "ok" ? (
          <p role="status" className="mx-auto mt-10 max-w-xl rounded-2xl border border-leaf/40 bg-leaf/10 p-5 font-semibold">
            {msg}
          </p>
        ) : (
          <form onSubmit={submit} noValidate className="mx-auto mt-10 max-w-xl text-left">
            <label htmlFor="email" className="mb-2 block text-sm font-bold text-moon">
              {t.final.formLabel}
            </label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                id="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (state !== "idle" && state !== "sending") setState("idle");
                }}
                placeholder={t.final.formPlaceholder}
                aria-invalid={state === "invalid"}
                aria-describedby="email-help"
                className="min-h-13 flex-1 rounded-full border-2 border-white/20 bg-white/10 px-5 text-base text-moon placeholder:text-moon-muted/70 focus:border-glow focus:outline-none"
              />
              <button
                type="submit"
                disabled={state === "sending"}
                className="btn-glow min-h-13 cursor-pointer rounded-full px-7 font-display text-lg font-semibold disabled:cursor-wait disabled:opacity-60"
              >
                {state === "sending" ? t.final.sending : t.final.formCta}
              </button>
            </div>
            <p id="email-help" aria-live="polite" className={`mt-3 text-sm ${msg ? "font-semibold text-[#fda4af]" : "text-moon-muted"}`}>
              {msg ?? t.final.formNote}
            </p>
          </form>
        )}

        <p className="mx-auto mt-14 max-w-2xl rounded-3xl border border-white/10 bg-white/[0.04] p-6 text-left text-lg italic leading-relaxed text-moon">
          {t.final.ps}
        </p>
      </Container>
    </section>
  );
}

/* ---------- footer + sticky mobile CTA ---------- */

function Footer({ t }: { t: Dict }) {
  return (
    <footer className="bg-[#070d22] pb-28 pt-12 text-sm text-moon-muted md:pb-12">
      <Container className="space-y-4">
        <Logo />
        <p className="max-w-3xl leading-relaxed">{t.footer.disclaimer}</p>
        <p className="max-w-3xl leading-relaxed">{t.footer.credit}</p>
        <p>{t.footer.event}</p>
      </Container>
    </footer>
  );
}

function StickyCta({ t }: { t: Dict }) {
  const [show, setShow] = useState(false);
  const seen = useRef({ hero: true, final: false });

  useEffect(() => {
    const hero = document.getElementById("hero");
    const final = document.getElementById("descarca");
    if (!hero || !final || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.target === hero) seen.current.hero = e.isIntersecting;
        if (e.target === final) seen.current.final = e.isIntersecting;
      });
      setShow(!seen.current.hero && !seen.current.final);
    });
    io.observe(hero);
    io.observe(final);
    return () => io.disconnect();
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night/95 p-3 backdrop-blur-md transition-transform duration-300 md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <a
        href="#descarca"
        tabIndex={show ? 0 : -1}
        className="btn-glow flex min-h-12 w-full items-center justify-center gap-2 rounded-full font-display text-lg font-semibold"
      >
        {t.sticky}
        <Arrow className="size-5" />
      </a>
    </div>
  );
}
