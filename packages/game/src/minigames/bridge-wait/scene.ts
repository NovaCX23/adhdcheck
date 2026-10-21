// Bridge Wait in 3D (three.js). Browser only: imported lazily by mount.ts.
//
// Timing (research/03 section 2): one requestAnimationFrame loop. Each callback first calls
// runner.frame(ts); when the cue is due, the runner calls onCue inside that call, which lights the lanterns
// and plays the chime; the same callback then renders, so ts is the onset of the frame that draws the cue.
// Responses come from a native pointerdown listener on the game container (event.timeStamp, never click).
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  DataTexture,
  DirectionalLight,
  Float32BufferAttribute,
  Fog,
  HemisphereLight,
  type Material,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RedFormat,
  Scene,
  Vector3,
  WebGLRenderer,
  type Texture,
  type Group,
} from "three";
import { GameAudio } from "./audio";
import { buildCrow, buildLuma, makeOutlineMaterial, type LumaRig } from "./luma";
import { BridgeWaitRunner, NARRATION_MS, type QueueItem, type RunState } from "./runner";
import { isPrimaryPointer } from "../../pointer";
import { STRINGS, narrationFor } from "./strings";
import type { BridgeWaitResult } from "./types";
import { buildUi } from "./ui";
import { LANTERN_OFF, LANTERN_ON, SIDE_X, buildWorld, deckY, groundY, type World } from "./world";

export interface SceneOptions {
  seed: number;
  trials?: number;
  stopSignal: boolean;
  assetBase: string;
  onComplete?: (result: BridgeWaitResult) => void;
}

const TARGET = new Vector3(0, 1.0, 0);
const LIGHT_ON = 5;
/** Luma stands a little in front of the bridge line on each bank, so the end posts never hide it. */
const BANK_Z = 0.9;
const lumaZ = (x: number) => BANK_Z * Math.min(1, Math.max(0, (Math.abs(x) - 2.7) / 0.9));
const VIEW_DIR = new Vector3(0, 0.2, 1).normalize();

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);
const easeInOut = (t: number) => {
  const x = Math.min(Math.max(t, 0), 1);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

export class Particles {
  readonly points: Points;
  private readonly pos: Float32Array;
  private readonly col: Float32Array;
  private readonly vel: Float32Array;
  private readonly base: Float32Array;
  private readonly life: Float32Array;
  private readonly max: Float32Array;
  private readonly grav: Float32Array;
  private cursor = 0;
  private live = 0;

  constructor(
    private readonly n: number,
    size: number,
    map: Texture,
  ) {
    this.pos = new Float32Array(n * 3).fill(-999);
    this.col = new Float32Array(n * 3);
    this.vel = new Float32Array(n * 3);
    this.base = new Float32Array(n * 3);
    this.life = new Float32Array(n);
    this.max = new Float32Array(n).fill(1);
    this.grav = new Float32Array(n);
    const geo = new BufferGeometry();
    geo.setAttribute("position", new Float32BufferAttribute(this.pos, 3));
    geo.setAttribute("color", new Float32BufferAttribute(this.col, 3));
    this.points = new Points(
      geo,
      new PointsMaterial({
        size,
        map,
        vertexColors: true,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    );
    this.points.frustumCulled = false;
  }

  /** ring = true: an even circle facing the camera (firework); otherwise a random sphere (sparkle). */
  spawn(o: Vector3, count: number, colors: Color[], speed: number, lifeMs: number, gravity: number, ring = false) {
    for (let k = 0; k < count; k++) {
      const i = this.cursor;
      this.cursor = (this.cursor + 1) % this.n;
      if (ring) {
        const a = (k / count) * Math.PI * 2;
        const s = speed * (k % 2 ? 1 : 0.62);
        this.vel[i * 3] = Math.cos(a) * s;
        this.vel[i * 3 + 1] = Math.sin(a) * s;
        this.vel[i * 3 + 2] = 0;
      } else {
        const u = Math.random() * 2 - 1;
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(1 - u * u);
        const s = speed * (0.55 + Math.random() * 0.45);
        this.vel[i * 3] = r * Math.cos(a) * s;
        this.vel[i * 3 + 1] = u * s + speed * 0.25;
        this.vel[i * 3 + 2] = r * Math.sin(a) * s * 0.6;
      }
      this.pos[i * 3] = o.x;
      this.pos[i * 3 + 1] = o.y;
      this.pos[i * 3 + 2] = o.z;
      const c = colors[k % colors.length] as Color;
      this.base[i * 3] = c.r;
      this.base[i * 3 + 1] = c.g;
      this.base[i * 3 + 2] = c.b;
      this.max[i] = lifeMs * (0.7 + Math.random() * 0.3);
      this.life[i] = this.max[i] as number;
      this.grav[i] = gravity;
    }
    this.live = Math.min(this.n, this.live + count);
  }

  update(dtMs: number) {
    if (this.live === 0) return;
    const dt = dtMs / 1000;
    const drag = Math.pow(0.18, dt);
    let alive = 0;
    for (let i = 0; i < this.n; i++) {
      const l = this.life[i] as number;
      if (l <= 0) continue;
      const nl = l - dtMs;
      this.life[i] = nl;
      if (nl <= 0) {
        this.col[i * 3] = this.col[i * 3 + 1] = this.col[i * 3 + 2] = 0;
        this.pos[i * 3 + 1] = -999;
        continue;
      }
      alive++;
      this.vel[i * 3 + 1] = ((this.vel[i * 3 + 1] as number) + (this.grav[i] as number) * dt) * drag;
      this.vel[i * 3] = (this.vel[i * 3] as number) * drag;
      this.vel[i * 3 + 2] = (this.vel[i * 3 + 2] as number) * drag;
      for (let k = 0; k < 3; k++) this.pos[i * 3 + k] = (this.pos[i * 3 + k] as number) + (this.vel[i * 3 + k] as number) * dt;
      const f = nl / (this.max[i] as number);
      const fade = f > 0.8 ? 1 : f / 0.8;
      for (let k = 0; k < 3; k++) this.col[i * 3 + k] = (this.base[i * 3 + k] as number) * fade;
    }
    this.live = alive;
    const geo = this.points.geometry;
    (geo.getAttribute("position") as Float32BufferAttribute).copyArray(this.pos).needsUpdate = true;
    (geo.getAttribute("color") as Float32BufferAttribute).copyArray(this.col).needsUpdate = true;
  }
}

type LumaMode = "idle" | "wave" | "talk" | "cross" | "hop" | "celebrate";

export function createBridgeWaitScene(parent: HTMLElement, opts: SceneOptions): { destroy: () => void } {
  const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ui = buildUi(parent);
  const audio = new GameAudio(opts.assetBase);
  audio.prefetch();

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (err) {
    // No WebGL: remove the DOM and audio this function already created, so the caller can show its fallback.
    audio.close();
    ui.destroy();
    throw err;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  ui.root.prepend(renderer.domElement);
  const canvas = renderer.domElement;

  const scene = new Scene();
  scene.fog = new Fog(0x8e68b4, 26, 75);
  const camera = new PerspectiveCamera(38, 1, 0.1, 200);

  const grad = new DataTexture(new Uint8Array([95, 165, 220, 255]), 4, 1, RedFormat);
  grad.minFilter = grad.magFilter = NearestFilter;
  grad.needsUpdate = true;
  const outlineMat = makeOutlineMaterial();

  scene.add(new HemisphereLight(0xc4ccff, 0x4a3a6e, 2.1));
  const moonLight = new DirectionalLight(0xfff0dc, 2.2);
  moonLight.position.set(-6, 10, 8);
  scene.add(moonLight);
  const rim = new DirectionalLight(0xff9ec8, 0.8);
  rim.position.set(8, 4, -6);
  scene.add(rim);

  const world: World = buildWorld(scene, grad, outlineMat);
  const luma: LumaRig = buildLuma(grad, outlineMat);
  luma.root.scale.setScalar(1.12);
  scene.add(luma.root);
  const crow: Group = buildCrow(grad, outlineMat);
  crow.visible = false;
  crow.position.set(0, deckY(0) + 0.05, -0.15);
  scene.add(crow);

  const sparkles = new Particles(160, 0.22, world.glow);
  const fireworks = new Particles(800, 0.62, world.glow);
  const WHITE = new Color(0xffffff);
  scene.add(sparkles.points, fireworks.points);
  const SPARK = [new Color(0xffffff), new Color(0xfff0a8), new Color(0x9ff5e6)];
  const FIRE = [new Color(0xffd66b), new Color(0xff8fc0), new Color(0x8ff0d8), new Color(0x9fc4ff), new Color(0xd2a8ff)];

  // ---- state for animation (visual only, never used for measurement) ----
  let side = -1; // Luma's bank: -1 left, 1 right
  let mode: LumaMode = "wave";
  let modeStart = 0;
  let pendingCross = false;
  let crossFrom = -SIDE_X;
  let lastHop = -1;
  let happyUntil = 0;
  let cueOn = false;
  let cueStart = 0;
  let cueOffStart = -1;
  let fireflyTarget = 1;
  let fireflyLevel = 0;
  let nextFirework = 0;
  let crowStart = -1;
  let lastTs = 0;
  let lastState: RunState = "intro";
  let raf = 0;
  let lost = false;
  let destroyed = false;

  const setMode = (m: LumaMode, ts: number) => {
    mode = m;
    modeStart = ts;
  };

  const setCue = (on: boolean) => {
    const l = world.lanterns;
    l.glass.color.copy(on ? LANTERN_ON : LANTERN_OFF);
    l.halo.opacity = on ? 1 : 0;
    l.reflection.opacity = on ? 0.75 : 0;
    l.light.intensity = on ? LIGHT_ON : 0;
    cueOn = on;
  };

  const runner = new BridgeWaitRunner(
    { seed: opts.seed, trials: opts.trials, stopSignal: opts.stopSignal },
    {
      onState: (s: RunState, ts: number, item: QueueItem | undefined) => {
        lastState = s;
        parent.dataset.phase = s;
        parent.dataset.practice = item?.practice ? "1" : "0";
        switch (s) {
          case "practice-intro":
            ui.play(true); // the instruction stays until the child taps (no timer)
            ui.say(STRINGS.practiceIntro);
            setMode("hop", ts);
            break;
          case "narration":
            setCue(false);
            cueOffStart = -1;
            crow.visible = false;
            crowStart = -1;
            fireflyTarget = 0;
            ui.say(narrationFor(opts.stopSignal));
            if (mode !== "cross") setMode("talk", ts);
            audio.babble(NARRATION_MS);
            break;
          case "waiting":
            ui.say(null);
            if (mode !== "cross") setMode("idle", ts);
            break;
          case "go":
            if (item?.practice) ui.hand(true);
            break;
          case "iti":
            ui.hand(false);
            cueOffStart = ts;
            break;
          case "between":
            ui.play(true);
            ui.say(STRINGS.realIntro);
            audio.play("ready", 0.6);
            if (mode !== "cross") setMode("hop", ts);
            break;
          case "done":
            setCue(false);
            ui.say(STRINGS.done);
            audio.play("done", 0.7);
            fireflyTarget = 1;
            nextFirework = ts + 300;
            setMode("celebrate", ts);
            break;
          default:
            break;
        }
      },
      onCue: (ts) => {
        // Inside runner.frame(ts): drawn by the render call of this same callback.
        setCue(true);
        cueStart = ts;
        audio.chime();
      },
      onCrow: (ts) => {
        crow.visible = true;
        crowStart = ts;
      },
      onCross: () => {
        pendingCross = true;
        ui.hand(false);
      },
      onComplete: (r) => opts.onComplete?.(r),
    },
  );
  parent.dataset.phase = "intro";
  ui.say(STRINGS.start);
  ui.play(true);

  const onDown = (e: PointerEvent) => {
    if (!isPrimaryPointer(e)) return; // a second finger is not a response
    audio.unlock(); // inside the gesture: required by iOS Safari
    if (runner.waitsForReady()) {
      // Only the Start button leaves an instruction: a tap elsewhere, or the second tap of a double tap, does nothing.
      if (ui.playHit(e.clientX, e.clientY) && runner.ready(e.timeStamp) === "ready") {
        ui.play(false);
        audio.play("start", 0.6);
      }
      return;
    }
    const kind = runner.pointerDown(e.timeStamp);
    if (kind === "start") {
      ui.play(false);
      audio.play("start", 0.6);
    }
  };
  const noMenu = (e: Event) => e.preventDefault();
  ui.root.addEventListener("pointerdown", onDown);
  ui.root.addEventListener("contextmenu", noMenu);

  const onLost = (e: Event) => {
    e.preventDefault(); // allows the context to be restored
    lost = true;
  };
  const onRestored = () => {
    lost = false;
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const target = TARGET.clone();
  let viewH = 1;
  let viewW = 1;
  const fit = () => {
    const w = Math.max(1, ui.root.clientWidth);
    const h = Math.max(1, ui.root.clientHeight);
    viewW = w;
    viewH = h;
    const aspect = w / h;
    const portrait = aspect < 1;
    camera.fov = portrait ? 50 : 38;
    const halfW = portrait ? 4.75 : 5.5;
    const tanH = Math.tan((camera.fov * Math.PI) / 360);
    const d = Math.max(9.5, halfW / (tanH * aspect));
    camera.aspect = aspect;
    // Portrait: aim above the bridge so it sits lower, the sky fills the top and the river below is the tap area.
    target.copy(TARGET);
    if (portrait) target.y += 1.6;
    camera.position.copy(TARGET).addScaledVector(VIEW_DIR, d);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    if (scene.fog instanceof Fog) {
      scene.fog.near = d + 14;
      scene.fog.far = d + 70;
    }
    renderer.setSize(w, h, false);
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(ui.root);

  const head = new Vector3();
  const tmp = new Vector3();

  const poseLuma = (ts: number) => {
    const t = ts - modeStart;
    let x = side * SIDE_X;
    let lift = 0;
    let sy = 1;
    let sx = 1;
    let turn = -side * 0.35;
    let flap = 0;
    let armL = 0;
    let armR = 0;
    let talking = false;

    if (mode === "cross") {
      const dir = -Math.sign(crossFrom);
      const CROUCH = 90;
      const HOPS = 5;
      const HOP = 190;
      const xs = crossFrom;
      const xe = -crossFrom;
      turn = dir * 0.9;
      flap = Math.sin(ts * 0.06) * 0.7;
      armL = armR = 0.6;
      if (t < CROUCH) {
        const k = easeOut(t / CROUCH);
        sy = 1 - 0.2 * k;
        sx = 1 + 0.14 * k;
        x = xs;
      } else if (t < CROUCH + HOPS * HOP) {
        const ht = t - CROUCH;
        const hop = Math.floor(ht / HOP);
        const p = (ht % HOP) / HOP;
        if (hop !== lastHop) {
          if (lastHop >= 0) audio.play(`step${hop % 3}` as "step0" | "step1" | "step2", 0.5);
          lastHop = hop;
        }
        const a = xs + ((xe - xs) * hop) / HOPS;
        const b = xs + ((xe - xs) * (hop + 1)) / HOPS;
        x = a + (b - a) * easeInOut(p);
        const height = hop === 0 || hop === HOPS - 1 ? 0.6 : 0.42;
        lift = height * 4 * p * (1 - p);
        const s = Math.sin(Math.PI * p);
        sy = 1 + 0.2 * s;
        sx = 1 - 0.1 * s;
        if (p < 0.16) {
          const q = 1 - p / 0.16;
          sy -= 0.22 * q;
          sx += 0.16 * q;
        }
      } else {
        const lt = t - CROUCH - HOPS * HOP;
        x = xe;
        if (lastHop !== HOPS) {
          lastHop = HOPS;
          side = Math.sign(xe);
          happyUntil = ts + 700;
          audio.play("step1", 0.5);
          audio.play("sparkle", 0.55);
          tmp.set(xe, groundY(xe) + 1.0, BANK_Z + 0.2);
          sparkles.spawn(tmp, 28, SPARK, 2.2, 750, -2.2);
        }
        const k = Math.min(lt / 260, 1);
        const sq = Math.sin(k * Math.PI) * (1 - k);
        sy = 1 - 0.25 * sq;
        sx = 1 + 0.18 * sq;
        turn = dir * 0.9 * (1 - easeOut(lt / 400)) - Math.sign(xe) * 0.35 * easeOut(lt / 400);
        flap = 0;
        if (lt > 420) setMode(lastState === "narration" ? "talk" : "idle", ts);
      }
    } else if (mode === "hop" || mode === "celebrate") {
      const period = mode === "celebrate" ? 720 : 620;
      const p = (t % period) / period;
      const air = p < 0.6 ? p / 0.6 : -1;
      if (reduced) {
        // Static pose, no looping jump (prefers-reduced-motion).
      } else if (air >= 0) {
        lift = (mode === "celebrate" ? 0.55 : 0.3) * 4 * air * (1 - air);
        const s = Math.sin(Math.PI * air);
        sy = 1 + 0.16 * s;
        sx = 1 - 0.08 * s;
      } else {
        const q = (p - 0.6) / 0.4;
        const sq = Math.sin(q * Math.PI) * 0.2;
        sy = 1 - sq;
        sx = 1 + sq * 0.7;
      }
      armL = armR = mode === "celebrate" ? (reduced ? 1.6 : 1.6 + Math.sin(ts * 0.012) * 0.3) : 0.8;
      flap = reduced ? 0 : Math.sin(ts * 0.05) * 0.5;
      if (mode === "hop" && t > 1250) setMode("idle", ts);
    } else {
      // idle, wave, talk
      sy = 1 + 0.018 * Math.sin(ts * 0.0032);
      sx = 1 - 0.009 * Math.sin(ts * 0.0032);
      if (mode === "wave") {
        const arm = side < 0 ? 1 : 0;
        const wave = 2.1 + Math.sin(ts * 0.011) * 0.45;
        if (arm) armR = wave;
        else armL = wave;
        if (!reduced) flap = Math.sin(ts * 0.004) * 0.12;
      }
      if (mode === "talk") {
        talking = t < NARRATION_MS - 150;
        lift = talking ? Math.abs(Math.sin(ts * 0.0105)) * 0.05 : 0;
        armL = armR = talking ? 0.35 + Math.sin(ts * 0.007) * 0.2 : 0;
      }
    }

    const z = lumaZ(x);
    luma.root.position.set(x, groundY(x) + lift, z);
    luma.root.rotation.y = turn;
    luma.squash.scale.set(sx, sy, sx);
    // Arms: rotate outward (z) around the shoulder; left arm mirrors right.
    (luma.arms[0] as Group).rotation.z = -armL;
    (luma.arms[1] as Group).rotation.z = armR;
    (luma.wings[0] as Group).rotation.y = flap;
    (luma.wings[1] as Group).rotation.y = -flap;
    for (const a of luma.antennae) a.rotation.z = Math.sin(ts * 0.004 + a.position.x * 9) * 0.05 - lift * 0.4;

    // Mouth and eyes
    luma.mouth.visible = talking;
    luma.smile.visible = !talking;
    if (talking) luma.mouth.scale.set(0.075, 0.025 + 0.045 * Math.abs(Math.sin(ts * 0.021)), 0.03);
    const blinkPhase = ts % 3400;
    let eyeY = blinkPhase < 120 ? 0.12 : 1;
    if (ts < happyUntil || mode === "celebrate") eyeY = Math.min(eyeY, 0.55);
    for (const e of luma.eyes) e.scale.y = eyeY;

    // Blob shadow stays on the ground and shrinks while in the air.
    const shadowScale = 1.35 * (1 - Math.min(lift, 0.6) * 0.6);
    world.shadow.position.set(x, groundY(x) + 0.012, z + 0.05);
    world.shadow.scale.set(shadowScale, shadowScale, 1);

    head.set(x, groundY(x) + lift + 1.6, z);
  };

  const frame = (ts: number) => {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (lost) return;
    const dt = lastTs ? Math.min(ts - lastTs, 50) : 16;
    lastTs = ts;

    // 1. Measurement state machine. May apply the cue (lanterns + chime) for this very frame.
    runner.frame(ts);
    ui.playEnabled(!runner.waitsForReady() || runner.canReady(ts));

    // 2. Visuals.
    if (pendingCross) {
      pendingCross = false;
      crossFrom = side * SIDE_X;
      lastHop = -1;
      setMode("cross", ts);
    }
    if (cueOn) {
      const breathe = 1.9 + Math.sin((ts - cueStart) * 0.007) * 0.1;
      for (const h of world.lanterns.halos) h.scale.setScalar(breathe);
    }
    if (cueOffStart >= 0 && cueOn) {
      const k = Math.min((ts - cueOffStart) / 450, 1);
      const l = world.lanterns;
      l.glass.color.copy(LANTERN_ON).lerp(LANTERN_OFF, k);
      l.halo.opacity = 1 - k;
      l.reflection.opacity = 0.75 * (1 - k);
      l.light.intensity = LIGHT_ON * (1 - k);
      if (k >= 1) {
        cueOn = false;
        cueOffStart = -1;
      }
    }
    if (crowStart >= 0) {
      const k = easeOut((ts - crowStart) / 220);
      crow.scale.setScalar(0.2 + 0.8 * k);
    }

    poseLuma(ts);

    // Decorative fireflies: fade, and drift only outside the trial loop.
    fireflyLevel += (fireflyTarget - fireflyLevel) * Math.min(1, dt / 350);
    const ffMat = world.fireflies.material as PointsMaterial;
    ffMat.opacity = fireflyLevel * 0.95;
    world.fireflies.visible = fireflyLevel > 0.01;
    if (world.fireflies.visible && !reduced) {
      const attr = world.fireflies.geometry.getAttribute("position") as Float32BufferAttribute;
      const b = world.fireflyBase;
      for (let i = 0; i < b.length / 3; i++) {
        attr.setXYZ(
          i,
          (b[i * 3] as number) + Math.sin(ts * 0.0006 + i) * 0.5,
          (b[i * 3 + 1] as number) + Math.sin(ts * 0.0011 + i * 2.1) * 0.3,
          (b[i * 3 + 2] as number) + Math.cos(ts * 0.0007 + i * 1.3) * 0.4,
        );
      }
      attr.needsUpdate = true;
    }

    if (lastState === "done" && !reduced && ts >= nextFirework) {
      nextFirework = ts + 520 + Math.random() * 300;
      for (let b = 0; b < 2; b++) {
        tmp.set((Math.random() - 0.5) * 8, 2.9 + Math.random() * 1.3, -0.4 - Math.random());
        const c = FIRE[Math.floor(Math.random() * FIRE.length)] as Color;
        fireworks.spawn(tmp, 40, [c, c, WHITE], 4.2, 1500, -0.9, true);
      }
    }
    sparkles.update(dt);
    fireworks.update(dt);

    // River flow: very slow and low contrast.
    world.water.offset.y = (ts * 0.000012) % 1;

    // Gentle camera drift only on the start and end screens.
    if (!reduced && (lastState === "intro" || lastState === "done")) {
      camera.position.x = Math.sin(ts * 0.00025) * 0.35;
      camera.lookAt(target);
    } else if (camera.position.x !== 0) {
      camera.position.x *= 0.9;
      if (Math.abs(camera.position.x) < 0.001) camera.position.x = 0;
      camera.lookAt(target);
    }

    // Speech bubble follows Luma's head.
    tmp.copy(head).project(camera);
    ui.place(((tmp.x + 1) / 2) * viewW, ((1 - tmp.y) / 2) * viewH - 8);

    renderer.render(scene, camera);
  };
  raf = requestAnimationFrame(frame);

  return {
    destroy: () => {
      destroyed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      ui.root.removeEventListener("pointerdown", onDown);
      ui.root.removeEventListener("contextmenu", noMenu);
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      audio.close();
      const mats = new Set<Material>();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as { material?: Material | Material[] }).material;
        if (Array.isArray(mat)) mat.forEach((x) => mats.add(x));
        else if (mat) mats.add(mat);
      });
      mats.forEach((m) => {
        (m as { map?: { dispose(): void } | null }).map?.dispose(); // e.g. the shadow texture
        m.dispose();
      });
      grad.dispose();
      world.glow.dispose();
      world.water.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      ui.destroy();
      delete parent.dataset.phase;
      delete parent.dataset.practice;
    },
  };
}
