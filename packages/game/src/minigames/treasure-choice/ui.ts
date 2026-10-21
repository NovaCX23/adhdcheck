import { insideRect } from "../../pointer";
// DOM layer over the 3D canvas: speech bubble, start button, practice hand and Luma's gem bag. Pointer events pass
// through (pointer-events: none); the game container itself takes every pointerdown. Same look as Bridge Wait.
// The bag is a collection: gems pile up inside it, and no number, count or progress bar is ever shown.
const CSS = `
.tc-root{position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;
background:linear-gradient(180deg,#0e1442 0%,#232a73 20%,#5a4aa6 34%,#c4719f 44%,#f4a77f 52%,#f4a77f 100%)}
.tc-root>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.tc-ui{position:absolute;inset:0;pointer-events:none;font-family:ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Nunito","Varela Round",system-ui,sans-serif}
.tc-anchor{position:absolute;left:0;top:0;will-change:transform}
.tc-bubble{position:relative;transform:translate(-50%,-100%) scale(.6);transform-origin:50% 100%;opacity:0;
width:max-content;max-width:min(84vw,520px);box-sizing:border-box;padding:16px 24px;border-radius:26px;
background:#fffdf7;color:#2a1f5c;font-size:clamp(19px,2.9vw,28px);line-height:1.28;font-weight:800;text-align:center;
box-shadow:0 5px 0 #d9cff5,0 14px 30px rgba(12,8,48,.38);transition:opacity .16s ease-out,transform .3s cubic-bezier(.16,1,.3,1)}
.tc-bubble.on{opacity:1;transform:translate(-50%,-100%) scale(1)}
.tc-tail{position:absolute;bottom:-15px;width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:17px solid #fffdf7;transform:translateX(-50%)}
.tc-play{position:absolute;left:50%;top:80%;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:50%;
background:radial-gradient(circle at 35% 30%,#7ff0e1,#2fbfae 60%,#1f9e95);box-shadow:0 7px 0 #167a73,0 16px 30px rgba(12,8,48,.4),inset 0 -6px 0 rgba(0,0,0,.08);
border:6px solid #fffdf7;transition:transform .25s cubic-bezier(.16,1,.3,1),opacity .2s ease-out}
.tc-play::after{content:"";position:absolute;left:50%;top:50%;margin:-26px 0 0 -16px;border-left:44px solid #fffdf7;border-top:26px solid transparent;border-bottom:26px solid transparent;filter:drop-shadow(0 3px 0 rgba(22,122,115,.6))}
.tc-play::before{content:"";position:absolute;inset:-18px;border-radius:50%;border:5px solid rgba(255,253,247,.55);animation:tc-ring 1.8s ease-out infinite}
.tc-play.off{opacity:0;transform:scale(.4)}
.tc-play.wait:not(.off){opacity:.4;filter:grayscale(.7)}
.tc-play.wait::before{animation:none;opacity:0}
@keyframes tc-ring{0%{transform:scale(.85);opacity:.9}100%{transform:scale(1.3);opacity:0}}
.tc-hand{position:absolute;left:0;top:0;width:96px;height:118px;opacity:0;transition:opacity .2s ease-out;will-change:transform}
.tc-hand.on{opacity:1}
.tc-hand.on svg{animation:tc-press .9s cubic-bezier(.16,1,.3,1) infinite}
.tc-hand .tc-ripple{position:absolute;left:30px;top:2px;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:5px solid #fffdf7;opacity:0}
.tc-hand.on .tc-ripple{animation:tc-rip .9s ease-out infinite}
@keyframes tc-press{0%{transform:translate(14px,26px)}45%{transform:translate(0,0) scale(.94)}60%{transform:translate(0,0) scale(.94)}100%{transform:translate(14px,26px)}}
@keyframes tc-rip{0%,40%{transform:scale(.3);opacity:0}50%{opacity:.9}100%{transform:scale(1.5);opacity:0}}
.tc-bag{position:absolute;left:50%;top:max(14px,env(safe-area-inset-top));width:104px;height:112px;margin-left:-52px;transform-origin:50% 90%;scale:1.2;translate:0 8px;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .3s ease-out;opacity:0}
.tc-bag.on{opacity:1}
.tc-bag.pop{transform:scale(1.12)}
.tc-bag svg{position:absolute;inset:0;filter:drop-shadow(0 6px 10px rgba(12,8,48,.35))}
.tc-pile{position:absolute;left:16px;right:16px;bottom:50px;height:120px;display:flex;flex-wrap:wrap-reverse;justify-content:center;align-content:flex-start;gap:0 1px}
.tc-pile i{display:block;width:20px;height:20px;margin-top:-6px;transform:scale(.2);opacity:0;transition:transform .35s cubic-bezier(.16,1,.3,1),opacity .2s ease-out}
.tc-pile i.in{transform:scale(1);opacity:1}
.tc-front{position:absolute;inset:0}
@media (prefers-reduced-motion: reduce){.tc-play::before{animation:none}.tc-hand.on svg{animation:none}.tc-hand.on .tc-ripple{animation:none;opacity:.8}.tc-bag.pop{transform:none}}
`;

// Original cartoon glove hand pointing up; the fingertip is the top-left of the box (left 30px, top 2px).
const HAND_SVG = `<svg viewBox="0 0 96 118" width="96" height="118" aria-hidden="true">
<g fill="#fffdf7" stroke="#2a1f5c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
<path d="M20 50 V14 a10 10 0 0 1 20 0 V46"/>
<path d="M40 44 a9 9 0 0 1 18 0 v6 a9 9 0 0 1 18 0 v6 a8 8 0 0 1 16 2 v22 c0 20 -14 34 -34 34 h-8 c-14 0 -22 -6 -30 -16 L6 82 c-5 -7 -2 -14 4 -16 c5 -2 10 0 14 5 l-4 -21 z"/>
</g></svg>`;

// Luma's cloth bag, drawn in two layers: the back (inside of the bag) and the front panel with its drawstring, so
// the gems sit between them and pile up out of the top.
const BAG_BACK = `<svg viewBox="0 0 104 112" width="104" height="112" aria-hidden="true">
<path d="M22 40 C10 58 8 96 30 104 C44 109 60 109 74 104 C96 96 94 58 82 40 Z" fill="#4b3a8f" stroke="#1d1640" stroke-width="5" stroke-linejoin="round"/>
</svg>`;
const BAG_FRONT = `<svg viewBox="0 0 104 112" width="104" height="112" aria-hidden="true">
<path d="M14 60 C10 80 14 98 30 104 C44 109 60 109 74 104 C90 98 94 80 90 60 C78 66 26 66 14 60 Z" fill="#7b62d6" stroke="#1d1640" stroke-width="5" stroke-linejoin="round"/>
<path d="M22 80 C40 86 64 86 82 80" fill="none" stroke="#9f8cf0" stroke-width="4" stroke-linecap="round"/>
<path d="M14 60 C26 66 78 66 90 60" fill="none" stroke="#ffcc4d" stroke-width="5" stroke-linecap="round"/>
<circle cx="52" cy="66" r="6" fill="#ffcc4d" stroke="#1d1640" stroke-width="3"/>
</svg>`;

const gemIcon = (hex: string) =>
  `<svg viewBox="0 0 16 16" width="20" height="20"><path d="M3 5 L5.5 2 H10.5 L13 5 L8 14 Z" fill="${hex}" stroke="#1d1640" stroke-width="1.4" stroke-linejoin="round"/><path d="M3 5 H13 M5.5 2 L8 5 L10.5 2" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="1"/></svg>`;

export interface Ui {
  root: HTMLDivElement;
  say: (text: string | null) => void;
  /** Place the bubble above a screen point (CSS pixels). */
  place: (x: number, y: number) => void;
  play: (on: boolean) => void;
  /** True when the point (client pixels) is on the visible Start button: only a tap there leaves an instruction. */
  playHit: (clientX: number, clientY: number) => boolean;
  /** False draws the Start button visibly disabled (the instruction has not been on screen long enough). */
  playEnabled: (on: boolean) => void;
  /** Show the practice hand with its fingertip at a screen point, or hide it (null). */
  handAt: (p: { x: number; y: number } | null) => void;
  bag: (on: boolean) => void;
  /** Add gems to the bag (colours as 0xRRGGBB). */
  addGems: (colors: number[]) => void;
  /** Screen point of the bag opening, for flying gems into it. */
  bagMouth: () => { x: number; y: number };
  destroy: () => void;
}

export function buildUi(parent: HTMLElement): Ui {
  const style = document.createElement("style");
  style.textContent = CSS;
  const root = document.createElement("div");
  root.className = "tc-root";
  const layer = document.createElement("div");
  layer.className = "tc-ui";
  const anchor = document.createElement("div");
  anchor.className = "tc-anchor";
  const bubble = document.createElement("div");
  bubble.className = "tc-bubble";
  const text = document.createElement("span");
  const tail = document.createElement("div");
  tail.className = "tc-tail";
  bubble.append(text, tail);
  anchor.append(bubble);
  const play = document.createElement("div");
  play.className = "tc-play";
  const hand = document.createElement("div");
  hand.className = "tc-hand";
  hand.innerHTML = `<div class="tc-ripple"></div>${HAND_SVG}`;
  const bag = document.createElement("div");
  bag.className = "tc-bag";
  bag.innerHTML = BAG_BACK;
  const pile = document.createElement("div");
  pile.className = "tc-pile";
  const front = document.createElement("div");
  front.className = "tc-front";
  front.innerHTML = BAG_FRONT;
  bag.append(pile, front);
  layer.append(anchor, bag, play, hand);
  root.append(layer);
  parent.append(style, root);

  let w = 0;
  let h = 0;
  let popTimer = 0;
  // The Start button is hidden (off) after an accepted tap, greyed (wait) while it is visible but not yet enabled. The two
  // never combine: a hidden button must not show as a faded ghost.
  let shown = true;
  let enabled = true;
  const paint = () => {
    play.classList.toggle("off", !shown);
    play.classList.toggle("wait", shown && !enabled);
  };
  return {
    root,
    say(t) {
      if (t === null) {
        bubble.classList.remove("on");
        return;
      }
      text.textContent = t;
      bubble.classList.add("on");
      w = 0;
    },
    place(x, y) {
      if (!w) {
        w = bubble.offsetWidth;
        h = bubble.offsetHeight;
      }
      // Never let the bubble slide under the bag at the top of the screen.
      const minY = bag.offsetTop + bag.offsetHeight + h + 22;
      y = Math.max(y, minY);
      const vw = root.clientWidth;
      const half = w / 2;
      const cx = Math.min(Math.max(x, half + 12), vw - half - 12);
      anchor.style.transform = `translate(${cx.toFixed(1)}px, ${Math.max(y, 0).toFixed(1)}px)`;
      const tailX = Math.min(Math.max(x - cx + half, 30), w - 30);
      tail.style.left = `${tailX.toFixed(1)}px`;
    },
    play(on) {
      shown = on;
      paint();
    },
    playEnabled(on) {
      enabled = on;
      paint();
    },
    playHit(x, y) {
      return shown && insideRect(x, y, play.getBoundingClientRect());
    },
    handAt(p) {
      if (!p) {
        hand.classList.remove("on");
        return;
      }
      // The fingertip is at (30, 2) inside the hand box.
      hand.style.transform = `translate(${(p.x - 30).toFixed(1)}px, ${(p.y - 2).toFixed(1)}px)`;
      hand.classList.add("on");
    },
    bag(on) {
      bag.classList.toggle("on", on);
    },
    addGems(colors) {
      for (const c of colors) {
        const g = document.createElement("i");
        g.innerHTML = gemIcon(`#${c.toString(16).padStart(6, "0")}`);
        pile.append(g);
        requestAnimationFrame(() => requestAnimationFrame(() => g.classList.add("in")));
      }
      bag.classList.add("pop");
      window.clearTimeout(popTimer);
      popTimer = window.setTimeout(() => bag.classList.remove("pop"), 260);
    },
    bagMouth() {
      const r = bag.getBoundingClientRect();
      const o = root.getBoundingClientRect();
      return { x: r.left - o.left + r.width / 2, y: r.top - o.top + r.height * 0.5 };
    },
    destroy() {
      window.clearTimeout(popTimer);
      root.remove();
      style.remove();
    },
  };
}
