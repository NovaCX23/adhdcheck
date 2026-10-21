import { insideRect } from "../../pointer";
// DOM layer over the 3D canvas: speech bubble, start button, practice hand. Same look as Bridge Wait
// (bridge-wait/ui.ts), with a night sky and a hand that can point at any star. Pointer events pass through
// (pointer-events: none); the game container itself takes every pointerdown.
const CSS = `
.sp-root{position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;
background:linear-gradient(180deg,#070b2b 0%,#141c55 38%,#2a2f78 66%,#3d3a86 100%)}
.sp-root>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.sp-ui{position:absolute;inset:0;pointer-events:none;font-family:ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Nunito","Varela Round",system-ui,sans-serif}
.sp-anchor{position:absolute;left:0;top:0;will-change:transform}
.sp-bubble{position:relative;transform:translate(-50%,-100%) scale(.6);transform-origin:50% 100%;opacity:0;
width:max-content;max-width:min(84vw,520px);box-sizing:border-box;padding:16px 24px;border-radius:26px;
background:#fffdf7;color:#2a1f5c;font-size:clamp(19px,2.9vw,28px);line-height:1.28;font-weight:800;text-align:center;
box-shadow:0 5px 0 #d9cff5,0 14px 30px rgba(4,4,30,.5);transition:opacity .16s ease-out,transform .3s cubic-bezier(.16,1,.3,1)}
.sp-bubble.on{opacity:1;transform:translate(-50%,-100%) scale(1)}
.sp-tail{position:absolute;bottom:-15px;width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:17px solid #fffdf7;transform:translateX(-50%)}
.sp-play{position:absolute;right:28px;bottom:28px;width:128px;height:128px;border-radius:50%;
background:radial-gradient(circle at 35% 30%,#7ff0e1,#2fbfae 60%,#1f9e95);box-shadow:0 7px 0 #167a73,0 16px 30px rgba(4,4,30,.5),inset 0 -6px 0 rgba(0,0,0,.08);
border:6px solid #fffdf7;transition:transform .25s cubic-bezier(.16,1,.3,1),opacity .2s ease-out}
.sp-play::after{content:"";position:absolute;left:50%;top:50%;margin:-26px 0 0 -16px;border-left:44px solid #fffdf7;border-top:26px solid transparent;border-bottom:26px solid transparent;filter:drop-shadow(0 3px 0 rgba(22,122,115,.6))}
.sp-play::before{content:"";position:absolute;inset:-18px;border-radius:50%;border:5px solid rgba(255,253,247,.55);animation:sp-ring 1.8s ease-out infinite}
.sp-play.off{opacity:0;transform:scale(.4)}
.sp-play.wait{opacity:.4;filter:grayscale(.7)}
.sp-play.wait::before{animation:none;opacity:0}
@keyframes sp-ring{0%{transform:scale(.85);opacity:.9}100%{transform:scale(1.3);opacity:0}}
.sp-hand{position:absolute;left:0;top:0;width:96px;height:118px;margin-left:-30px;opacity:0;transition:opacity .2s ease-out;will-change:transform}
.sp-hand.on{opacity:1}
.sp-hand.on svg{animation:sp-press .9s cubic-bezier(.16,1,.3,1) infinite}
.sp-hand .sp-ripple{position:absolute;left:30px;top:2px;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:5px solid #fffdf7;opacity:0}
.sp-hand.on .sp-ripple{animation:sp-rip .9s ease-out infinite}
@keyframes sp-press{0%{transform:translate(14px,26px)}45%{transform:translate(0,0) scale(.94)}60%{transform:translate(0,0) scale(.94)}100%{transform:translate(14px,26px)}}
@keyframes sp-rip{0%,40%{transform:scale(.3);opacity:0}50%{opacity:.9}100%{transform:scale(1.5);opacity:0}}
@media (prefers-reduced-motion: reduce){.sp-play::before{animation:none}.sp-hand.on svg{animation:none}.sp-hand.on .sp-ripple{animation:none;opacity:.8}}
`;

// Original cartoon glove hand pointing up (same drawing as Bridge Wait); the fingertip is at (30px, 2px).
const HAND_SVG = `<svg viewBox="0 0 96 118" width="96" height="118" aria-hidden="true">
<g fill="#fffdf7" stroke="#2a1f5c" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">
<path d="M20 50 V14 a10 10 0 0 1 20 0 V46"/>
<path d="M40 44 a9 9 0 0 1 18 0 v6 a9 9 0 0 1 18 0 v6 a8 8 0 0 1 16 2 v22 c0 20 -14 34 -34 34 h-8 c-14 0 -22 -6 -30 -16 L6 82 c-5 -7 -2 -14 4 -16 c5 -2 10 0 14 5 l-4 -21 z"/>
</g></svg>`;

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
  /** Point the hand's fingertip at a screen point, or hide it with null. */
  handAt: (p: { x: number; y: number } | null) => void;
  destroy: () => void;
}

export function buildUi(parent: HTMLElement): Ui {
  const style = document.createElement("style");
  style.textContent = CSS;
  const root = document.createElement("div");
  root.className = "sp-root";
  const layer = document.createElement("div");
  layer.className = "sp-ui";
  const anchor = document.createElement("div");
  anchor.className = "sp-anchor";
  const bubble = document.createElement("div");
  bubble.className = "sp-bubble";
  const text = document.createElement("span");
  const tail = document.createElement("div");
  tail.className = "sp-tail";
  bubble.append(text, tail);
  anchor.append(bubble);
  const play = document.createElement("div");
  play.className = "sp-play";
  const hand = document.createElement("div");
  hand.className = "sp-hand";
  hand.innerHTML = `<div class="sp-ripple"></div>${HAND_SVG}`;
  layer.append(anchor, play, hand);
  root.append(layer);
  parent.append(style, root);

  let w = 0;
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
      // Keep the bubble on screen; the tail still points at Luma.
      if (!w) w = bubble.offsetWidth;
      const vw = root.clientWidth;
      const half = w / 2;
      const cx = Math.min(Math.max(x, half + 12), vw - half - 12);
      anchor.style.transform = `translate(${cx.toFixed(1)}px, ${Math.max(y, 0).toFixed(1)}px)`;
      const tailX = Math.min(Math.max(x - cx + half, 30), w - 30);
      tail.style.left = `${tailX.toFixed(1)}px`;
    },
    play(on) {
      play.classList.toggle("off", !on);
    },
    playEnabled(on) {
      play.classList.toggle("wait", !on);
    },
    playHit(x, y) {
      return !play.classList.contains("off") && insideRect(x, y, play.getBoundingClientRect());
    },
    handAt(p) {
      if (!p) {
        hand.classList.remove("on");
        return;
      }
      hand.style.transform = `translate(${p.x.toFixed(1)}px, ${(p.y - 2).toFixed(1)}px)`;
      hand.classList.add("on");
    },
    destroy() {
      root.remove();
      style.remove();
    },
  };
}
