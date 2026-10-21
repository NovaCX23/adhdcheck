import { insideRect } from "../../pointer";
// DOM layer over the 3D canvas: speech bubble, start button, practice hand. Pointer events pass through
// (pointer-events: none); the game container itself takes every pointerdown.
const CSS = `
.bw-root{position:relative;width:100%;height:100%;overflow:hidden;touch-action:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none;-webkit-tap-highlight-color:transparent;
background:linear-gradient(180deg,#0e1442 0%,#232a73 20%,#5a4aa6 34%,#c4719f 44%,#f4a77f 52%,#f4a77f 100%)}
.bw-root>canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.bw-ui{position:absolute;inset:0;pointer-events:none;font-family:ui-rounded,"SF Pro Rounded","Arial Rounded MT Bold","Nunito","Varela Round",system-ui,sans-serif}
.bw-anchor{position:absolute;left:0;top:0;will-change:transform}
.bw-bubble{position:relative;transform:translate(-50%,-100%) scale(.6);transform-origin:50% 100%;opacity:0;
width:max-content;max-width:min(84vw,540px);box-sizing:border-box;padding:16px 24px;border-radius:26px;
background:#fffdf7;color:#2a1f5c;font-size:clamp(19px,2.9vw,28px);line-height:1.28;font-weight:800;text-align:center;
box-shadow:0 5px 0 #d9cff5,0 14px 30px rgba(12,8,48,.38);transition:opacity .16s ease-out,transform .3s cubic-bezier(.16,1,.3,1)}
.bw-bubble.on{opacity:1;transform:translate(-50%,-100%) scale(1)}
.bw-tail{position:absolute;bottom:-15px;width:0;height:0;border-left:13px solid transparent;border-right:13px solid transparent;border-top:17px solid #fffdf7;transform:translateX(-50%)}
.bw-play{position:absolute;left:50%;top:70%;width:128px;height:128px;margin:-64px 0 0 -64px;border-radius:50%;
background:radial-gradient(circle at 35% 30%,#7ff0e1,#2fbfae 60%,#1f9e95);box-shadow:0 7px 0 #167a73,0 16px 30px rgba(12,8,48,.4),inset 0 -6px 0 rgba(0,0,0,.08);
border:6px solid #fffdf7;transition:transform .25s cubic-bezier(.16,1,.3,1),opacity .2s ease-out}
.bw-play::after{content:"";position:absolute;left:50%;top:50%;margin:-26px 0 0 -16px;border-left:44px solid #fffdf7;border-top:26px solid transparent;border-bottom:26px solid transparent;filter:drop-shadow(0 3px 0 rgba(22,122,115,.6))}
.bw-play::before{content:"";position:absolute;inset:-18px;border-radius:50%;border:5px solid rgba(255,253,247,.55);animation:bw-ring 1.8s ease-out infinite}
.bw-play.off{opacity:0;transform:scale(.4)}
.bw-play.wait:not(.off){opacity:.4;filter:grayscale(.7)}
.bw-play.wait::before{animation:none;opacity:0}
@keyframes bw-ring{0%{transform:scale(.85);opacity:.9}100%{transform:scale(1.3);opacity:0}}
.bw-hand{position:absolute;left:50%;top:76%;width:96px;height:118px;margin-left:-30px;opacity:0;transition:opacity .2s ease-out}
.bw-hand.on{opacity:1}
.bw-hand.on svg{animation:bw-press .9s cubic-bezier(.16,1,.3,1) infinite}
.bw-hand .bw-ripple{position:absolute;left:30px;top:2px;width:56px;height:56px;margin:-28px 0 0 -28px;border-radius:50%;border:5px solid #fffdf7;opacity:0}
.bw-hand.on .bw-ripple{animation:bw-rip .9s ease-out infinite}
@keyframes bw-press{0%{transform:translate(14px,26px)}45%{transform:translate(0,0) scale(.94)}60%{transform:translate(0,0) scale(.94)}100%{transform:translate(14px,26px)}}
@keyframes bw-rip{0%,40%{transform:scale(.3);opacity:0}50%{opacity:.9}100%{transform:scale(1.5);opacity:0}}
@media (prefers-reduced-motion: reduce){.bw-play::before{animation:none}.bw-hand.on svg{animation:none}.bw-hand.on .bw-ripple{animation:none;opacity:.8}}
`;

// Original cartoon glove hand pointing up; the fingertip is the top-left of the box (left 30px, top 2px).
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
  hand: (on: boolean) => void;
  destroy: () => void;
}

export function buildUi(parent: HTMLElement): Ui {
  const style = document.createElement("style");
  style.textContent = CSS;
  const root = document.createElement("div");
  root.className = "bw-root";
  const layer = document.createElement("div");
  layer.className = "bw-ui";
  const anchor = document.createElement("div");
  anchor.className = "bw-anchor";
  const bubble = document.createElement("div");
  bubble.className = "bw-bubble";
  const text = document.createElement("span");
  const tail = document.createElement("div");
  tail.className = "bw-tail";
  bubble.append(text, tail);
  anchor.append(bubble);
  const play = document.createElement("div");
  play.className = "bw-play";
  const hand = document.createElement("div");
  hand.className = "bw-hand";
  hand.innerHTML = `<div class="bw-ripple"></div>${HAND_SVG}`;
  layer.append(anchor, play, hand);
  root.append(layer);
  parent.append(style, root);

  let w = 0;
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
    hand(on) {
      hand.classList.toggle("on", on);
    },
    destroy() {
      root.remove();
      style.remove();
    },
  };
}
