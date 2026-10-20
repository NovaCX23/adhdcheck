// DOM view for Route Planner: a 5 x 5 night garden, Luma the firefly, glowing seeds and rocks. Plain DOM and
// CSS (no three.js): the board is the only thing on screen while a puzzle runs, nothing else moves, and the
// open squares next to Luma show a faint ring so the child sees where a tap goes (adhdcheck-dev skill, 4).
// The game container takes every pointerdown; pointer-events are off on everything inside it.
import { isPrimaryPointer } from "../../pointer";
import { hintStep, same } from "./logic";
import { RoutePlannerRunner, type Board } from "./runner";
import { STRINGS } from "./strings";
import type { Cell, RoutePlannerResult } from "./types";

const CSS = `
.rp-root{position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;
background:radial-gradient(120% 80% at 50% 0%,#1d2a63 0%,#101a45 45%,#0a1030 100%);font-family:ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Nunito","Varela Round",system-ui,sans-serif;color:#fffdf7}
.rp-root *{pointer-events:none}
.rp-say{position:absolute;left:50%;top:max(14px,3vh);transform:translateX(-50%);width:max-content;max-width:min(88vw,560px);box-sizing:border-box;padding:12px 22px;border-radius:22px;
background:#fffdf7;color:#2a1f5c;font-size:clamp(18px,2.6vw,26px);line-height:1.28;font-weight:800;text-align:center;box-shadow:0 5px 0 #d9cff5,0 14px 30px rgba(4,4,30,.45);
opacity:0;transition:opacity .2s ease-out}
.rp-say.on{opacity:1}
.rp-board{position:absolute;left:50%;top:54%;transform:translate(-50%,-50%);display:grid;gap:var(--gap);padding:var(--gap);border-radius:28px;
background:#173d3a;box-shadow:inset 0 0 0 4px #24564f,0 18px 40px rgba(0,0,0,.45);opacity:0;transition:opacity .25s ease-out}
.rp-board.on{opacity:1}
.rp-cell{position:relative;border-radius:18px;background:#1f5148;box-shadow:inset 0 -5px 0 rgba(0,0,0,.18)}
.rp-cell.next::after{content:"";position:absolute;inset:10%;border-radius:14px;border:3px solid rgba(255,253,247,.35)}
.rp-rock{position:absolute;inset:14%;border-radius:42% 48% 38% 52%;background:radial-gradient(circle at 35% 30%,#b9b6c9,#7d7a93 60%,#5c5973);box-shadow:inset 0 -6px 0 rgba(0,0,0,.2)}
.rp-seed{position:absolute;left:50%;top:50%;width:34%;height:34%;transform:translate(-50%,-50%);border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
background:radial-gradient(circle at 40% 35%,#fff6c7,#ffd54d 55%,#f2a51d);box-shadow:0 0 18px 6px rgba(255,205,80,.55);transition:transform .25s ease-out,opacity .25s ease-out}
.rp-seed.taken{transform:translate(-50%,-140%) scale(.2);opacity:0}
.rp-luma{position:absolute;left:0;top:0;width:var(--cell);height:var(--cell);transition:transform .18s ease-out;will-change:transform}
.rp-luma i{position:absolute;left:50%;top:50%;width:42%;height:42%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 40% 35%,#fffbe0,#ffe27a 55%,#ffc23d);
box-shadow:0 0 22px 10px rgba(255,214,110,.6)}
.rp-luma b{position:absolute;top:22%;width:26%;height:30%;border-radius:50%;background:rgba(220,235,255,.75)}
.rp-luma b:first-of-type{left:22%;transform:rotate(-25deg)}.rp-luma b:last-of-type{right:22%;transform:rotate(25deg)}
.rp-hand{position:absolute;left:0;top:0;width:80px;height:98px;margin-left:-25px;opacity:0;transition:opacity .2s ease-out}
.rp-hand.on{opacity:1}
.rp-hand.on svg{animation:rp-press .9s cubic-bezier(.16,1,.3,1) infinite}
@keyframes rp-press{0%{transform:translate(12px,22px)}45%,60%{transform:translate(0,0) scale(.94)}100%{transform:translate(12px,22px)}}
.rp-play{position:absolute;left:50%;top:58%;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:50%;border:6px solid #fffdf7;
background:radial-gradient(circle at 35% 30%,#7ff0e1,#2fbfae 60%,#1f9e95);box-shadow:0 7px 0 #167a73,0 16px 30px rgba(4,4,30,.5);transition:opacity .2s ease-out,transform .25s ease-out}
.rp-play::after{content:"";position:absolute;left:50%;top:50%;margin:-26px 0 0 -16px;border-left:44px solid #fffdf7;border-top:26px solid transparent;border-bottom:26px solid transparent}
.rp-play.off{opacity:0;transform:scale(.4)}
@media (prefers-reduced-motion: reduce){.rp-luma,.rp-seed{transition:none}.rp-hand.on svg{animation:none}}
`;

const HAND_SVG = `<svg viewBox="0 0 96 118" width="80" height="98" aria-hidden="true">
<g fill="#fffdf7" stroke="#2a1f5c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
<path d="M20 50 V14 a10 10 0 0 1 20 0 V46"/>
<path d="M40 44 a9 9 0 0 1 18 0 v6 a9 9 0 0 1 18 0 v6 a8 8 0 0 1 16 2 v22 c0 20 -14 34 -34 34 h-8 c-14 0 -22 -6 -30 -16 L6 82 c-5 -7 -2 -14 4 -16 c5 -2 10 0 14 5 l-4 -21 z"/>
</g></svg>`;

export interface ViewOptions {
  onComplete?: (result: RoutePlannerResult) => void;
}

export function createRoutePlannerView(parent: HTMLElement, opts: ViewOptions = {}): { destroy: () => void } {
  const style = document.createElement("style");
  style.textContent = CSS;
  const root = document.createElement("div");
  root.className = "rp-root";
  const say = document.createElement("div");
  say.className = "rp-say";
  const board = document.createElement("div");
  board.className = "rp-board";
  const play = document.createElement("div");
  play.className = "rp-play";
  const hand = document.createElement("div");
  hand.className = "rp-hand";
  hand.innerHTML = HAND_SVG;
  root.append(board, say, play, hand);
  parent.append(style, root);

  let cells: HTMLDivElement[] = [];
  let seeds: { cell: Cell; el: HTMLDivElement }[] = [];
  let luma: HTMLDivElement | null = null;
  let cellPx = 0;
  let gapPx = 0;
  let cols = 5;

  const text = (t: string | null) => {
    if (t) say.textContent = t;
    say.classList.toggle("on", !!t);
  };

  function layout() {
    const w = root.clientWidth;
    const h = root.clientHeight;
    const side = Math.min(w * 0.92, h * 0.74, 640);
    gapPx = Math.max(6, Math.round(side * 0.018));
    cellPx = Math.floor((side - gapPx * (cols + 1)) / cols);
    board.style.setProperty("--gap", `${gapPx}px`);
    board.style.setProperty("--cell", `${cellPx}px`);
    board.style.gridTemplateColumns = `repeat(${cols}, ${cellPx}px)`;
    board.style.gridAutoRows = `${cellPx}px`;
  }

  const cellOrigin = (c: Cell) => ({ x: gapPx + c.c * (cellPx + gapPx), y: gapPx + c.r * (cellPx + gapPx) });

  function drawBoard(b: Board) {
    cols = b.puzzle.cols;
    layout();
    board.replaceChildren();
    cells = [];
    seeds = [];
    for (let r = 0; r < b.puzzle.rows; r++)
      for (let c = 0; c < b.puzzle.cols; c++) {
        const el = document.createElement("div");
        el.className = "rp-cell";
        const here = { c, r };
        if (b.puzzle.rocks.some((x) => same(x, here))) el.append(Object.assign(document.createElement("div"), { className: "rp-rock" }));
        const seed = b.puzzle.seeds.find((x) => same(x, here));
        if (seed) {
          const s = Object.assign(document.createElement("div"), { className: "rp-seed" });
          el.append(s);
          seeds.push({ cell: seed, el: s });
        }
        board.append(el);
        cells.push(el);
      }
    luma = Object.assign(document.createElement("div"), { className: "rp-luma" });
    luma.innerHTML = "<b></b><b></b><i></i>";
    luma.style.setProperty("--cell", `${cellPx}px`);
    board.append(luma);
    update(b);
    board.classList.add("on");
  }

  function update(b: Board) {
    if (!luma) return;
    const o = cellOrigin(b.at);
    luma.style.transform = `translate(${o.x}px, ${o.y}px)`;
    for (const s of seeds) s.el.classList.toggle("taken", b.taken.some((t) => same(t, s.cell)));
    const done = b.taken.length === b.puzzle.seeds.length;
    cells.forEach((el, k) => {
      const c = { c: k % b.puzzle.cols, r: Math.floor(k / b.puzzle.cols) };
      const next = !done && Math.abs(c.c - b.at.c) + Math.abs(c.r - b.at.r) === 1 && !b.puzzle.rocks.some((x) => same(x, c));
      el.classList.toggle("next", next);
    });
    // Practice only: the hand points at the next square of a fewest-moves route.
    const step = b.practice && !done ? hintStep(b.puzzle, b.at, b.taken) : null;
    if (step) {
      const br = board.getBoundingClientRect();
      const rr = root.getBoundingClientRect();
      const o2 = cellOrigin(step);
      hand.style.transform = `translate(${(br.left - rr.left + o2.x + cellPx / 2).toFixed(1)}px, ${(br.top - rr.top + o2.y + cellPx / 2).toFixed(1)}px)`;
    }
    hand.classList.toggle("on", !!step);
  }

  const runner = new RoutePlannerRunner({
    onState: (s, _ts, b) => {
      if (s === "practice-intro") {
        play.classList.add("off");
        text(STRINGS.practiceIntro);
      }
      if (s === "puzzle") text(b?.practice ? STRINGS.practiceIntro : STRINGS.boardIntro);
      if (s === "between") {
        text(STRINGS.between);
        board.classList.remove("on");
        hand.classList.remove("on");
      }
      if (s === "done") text(STRINGS.done);
    },
    onBoard: (_ts, b) => drawBoard(b),
    onMove: (_t, b) => update(b),
    onComplete: (result) => opts.onComplete?.(result),
  });
  text(STRINGS.start);

  function cellAt(x: number, y: number): Cell | null {
    if (!runner.board || !board.classList.contains("on")) return null;
    const br = board.getBoundingClientRect();
    const c = Math.floor((x - br.left - gapPx / 2) / (cellPx + gapPx));
    const r = Math.floor((y - br.top - gapPx / 2) / (cellPx + gapPx));
    const { cols: nc, rows: nr } = runner.board.puzzle;
    return c >= 0 && r >= 0 && c < nc && r < nr ? { c, r } : null;
  }

  const onDown = (e: PointerEvent) => {
    e.preventDefault();
    if (!isPrimaryPointer(e)) return; // a second finger is not a response
    runner.pointerDown(e.timeStamp, cellAt(e.clientX, e.clientY));
  };
  root.addEventListener("pointerdown", onDown);
  const onResize = () => runner.board && drawBoard(runner.board);
  window.addEventListener("resize", onResize);

  let raf = 0;
  const loop = (ts: number) => {
    runner.frame(ts);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      root.removeEventListener("pointerdown", onDown);
      window.removeEventListener("resize", onResize);
      root.remove();
      style.remove();
    },
  };
}
