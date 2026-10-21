// Star Path in 3D (three.js). Browser only: imported lazily by mount.ts.
//
// Timing (research/03 section 2), as in Bridge Wait: one requestAnimationFrame loop. Each callback first calls
// runner.frame(ts); a star lit by the runner (onStarOn) inside that call is drawn by the render call of the same
// callback, so ts is its onset. Taps come from a native pointerdown listener on the game container
// (event.timeStamp, never click); the scene only finds which star is under the finger.
//
// Calm design (adhdcheck-dev skill): while stars are shown and repeated, nothing else moves or lights up; the
// background dots are tiny, dim and static so they never read as stars to tap.
import {
  AdditiveBlending,
  BufferGeometry,
  Color,
  CylinderGeometry,
  DataTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Float32BufferAttribute,
  Group,
  HemisphereLight,
  type Material,
  Mesh,
  MeshToonMaterial,
  NearestFilter,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  RedFormat,
  Scene,
  Shape,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  WebGLRenderer,
} from "three";
import { GameAudio } from "../bridge-wait/audio";
import { buildLuma, makeOutlineMaterial, outline, type LumaRig } from "../bridge-wait/luma";
import { Particles } from "../bridge-wait/scene";
import { glowTexture } from "../bridge-wait/world";
import { StarTones } from "./audio";
import { N_STARS } from "./logic";
import { pickStar, starLayout } from "./layout";
// TODO: design choice, no source: length of the sound that goes with Luma talking (a sound effect, not a display time).
const BABBLE_MS = 2000;
import { StarPathRunner, type Current, type RunState } from "./runner";
import { isPrimaryPointer } from "../../pointer";
import { STRINGS } from "./strings";
import type { StarPathResult } from "./types";
import { buildUi } from "./ui";

export interface SceneOptions {
  seed: number;
  maxLength?: number;
  /** URL prefix of the shared sound samples (Bridge Wait's). */
  assetBase: string;
  onComplete?: (result: StarPathResult) => void;
}

const STAR_OFF = new Color(0x9ea3ec);
const STAR_ON = new Color(0xffe066);
const STAR_GLOW = new Color(0x7a6210);
const BLACK = new Color(0x000000);
const FLASH_MS = 350;
const CAMERA_Y = 3;
const CAMERA_Z = 12;
const GROUND_R = 30;
const MIN_HIT_PX = 48; // at least the 44 px touch target of the skill, plus a margin

const easeOut = (t: number) => 1 - Math.pow(1 - Math.min(Math.max(t, 0), 1), 3);

interface StarObj {
  group: Group;
  mat: MeshToonMaterial;
  halo: Sprite;
  haloMat: SpriteMaterial;
  shown: boolean; // lit by the presentation
  flashUntil: number; // lit briefly by a tap
  litSince: number;
  wasLit: boolean;
}

function starShape(outer: number, inner: number): Shape {
  const s = new Shape();
  for (let k = 0; k < 10; k++) {
    const a = Math.PI / 2 + (k * Math.PI) / 5;
    const r = k % 2 ? inner : outer;
    const x = Math.cos(a) * r;
    const y = Math.sin(a) * r;
    if (k === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  }
  s.closePath();
  return s;
}

type LumaMode = "idle" | "talk" | "look" | "hop" | "celebrate";

export function createStarPathScene(parent: HTMLElement, opts: SceneOptions): { destroy: () => void } {
  const reduced = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const ui = buildUi(parent);
  const audio = new GameAudio(opts.assetBase);
  audio.prefetch();
  const tones = new StarTones();

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
  const camera = new PerspectiveCamera(40, 1, 0.1, 200);
  const grad = new DataTexture(new Uint8Array([95, 165, 220, 255]), 4, 1, RedFormat);
  grad.minFilter = grad.magFilter = NearestFilter;
  grad.needsUpdate = true;
  const outlineMat = makeOutlineMaterial();
  const glow = glowTexture();
  const toon = (c: number) => new MeshToonMaterial({ color: new Color(c), gradientMap: grad });

  scene.add(new HemisphereLight(0xb8c2ff, 0x2a2350, 2.0));
  const moonLight = new DirectionalLight(0xe8ecff, 1.8);
  moonLight.position.set(-5, 9, 9);
  scene.add(moonLight);

  // ---- ground: two soft hills ----
  const sphere = new SphereGeometry(1, 48, 24);
  const hill = new Mesh(sphere, toon(0x2f6b74));
  hill.scale.setScalar(GROUND_R);
  scene.add(hill);
  const backHill = new Mesh(sphere, toon(0x264a6e));
  backHill.scale.set(22, 12, 10);
  scene.add(backHill);

  // ---- a few round trees on the back hill ----
  const trees: Group[] = [];
  const trunkGeo = new CylinderGeometry(0.08, 0.11, 0.7, 10);
  for (let k = 0; k < 3; k++) {
    const tree = new Group();
    const trunk = new Mesh(trunkGeo, toon(0x4a3560));
    trunk.position.y = 0.35;
    const crown = new Mesh(sphere, toon(k % 2 ? 0x2c7f7a : 0x3a8f72));
    crown.scale.set(0.55, 0.62, 0.55);
    crown.position.y = 0.95;
    outline(crown, outlineMat, 1.06);
    tree.add(trunk, crown);
    scene.add(tree);
    trees.push(tree);
  }

  // ---- background dots: tiny, dim, static, far away ----
  const dotPos: number[] = [];
  for (let k = 0; k < 140; k++) {
    const a = Math.sin(k * 12.9898) * 43758.5453;
    const b = Math.sin(k * 78.233) * 12345.6789;
    dotPos.push((a - Math.floor(a) - 0.5) * 90, 2 + (b - Math.floor(b)) * 26, -40);
  }
  const dotGeo = new BufferGeometry();
  dotGeo.setAttribute("position", new Float32BufferAttribute(dotPos, 3));
  const dots = new Points(
    dotGeo,
    new PointsMaterial({ size: 0.18, map: glow, color: 0xcfd6ff, transparent: true, opacity: 0.35, depthWrite: false }),
  );
  scene.add(dots);

  // ---- the nine stars ----
  const starGeo = new ExtrudeGeometry(starShape(0.5, 0.24), {
    depth: 0.12,
    bevelEnabled: true,
    bevelThickness: 0.07,
    bevelSize: 0.06,
    bevelSegments: 3,
  });
  starGeo.center();
  const stars: StarObj[] = [];
  for (let k = 0; k < N_STARS; k++) {
    const group = new Group();
    const mat = new MeshToonMaterial({ color: STAR_OFF.clone(), gradientMap: grad });
    const body = new Mesh(starGeo, mat);
    outline(body, outlineMat, 1.1);
    const haloMat = new SpriteMaterial({ map: glow, color: 0xffe9a0, transparent: true, opacity: 0, depthWrite: false, blending: AdditiveBlending });
    const halo = new Sprite(haloMat);
    halo.scale.setScalar(2.6);
    halo.position.z = -0.1;
    group.add(halo, body);
    scene.add(group);
    stars.push({ group, mat, halo, haloMat, shown: false, flashUntil: 0, litSince: 0, wasLit: false });
  }
  const layout = starLayout();

  // ---- Luma ----
  const luma: LumaRig = buildLuma(grad, outlineMat);
  scene.add(luma.root);
  const shadowMat = new SpriteMaterial({ map: glow, color: 0x0a0826, transparent: true, opacity: 0.45, depthWrite: false });
  const shadow = new Sprite(shadowMat);
  shadow.scale.set(1.5, 0.35, 1);
  scene.add(shadow);

  const sparkles = new Particles(160, 0.22, glow);
  const fireworks = new Particles(600, 0.55, glow);
  scene.add(sparkles.points, fireworks.points);
  const SPARK = [new Color(0xffffff), new Color(0xfff0a8), new Color(0x9ff5e6)];
  const FIRE = [new Color(0xffd66b), new Color(0xff8fc0), new Color(0x8ff0d8), new Color(0x9fc4ff), new Color(0xd2a8ff)];
  const WHITE = new Color(0xffffff);

  // ---- layout, recomputed on resize ----
  let viewW = 1;
  let viewH = 1;
  let starWorldR = 0.5;
  const lumaPos = new Vector3();
  const groundTop = (x: number, top: number) => top - (GROUND_R - Math.sqrt(GROUND_R * GROUND_R - x * x));
  const fit = () => {
    const w = Math.max(1, ui.root.clientWidth);
    const h = Math.max(1, ui.root.clientHeight);
    viewW = w;
    viewH = h;
    const aspect = w / h;
    const portrait = aspect < 1;
    camera.fov = portrait ? 56 : 40;
    camera.aspect = aspect;
    camera.position.set(0, CAMERA_Y, CAMERA_Z);
    camera.lookAt(0, CAMERA_Y, 0);
    camera.updateProjectionMatrix();
    renderer.setSize(w, h, false);

    const hh = CAMERA_Z * Math.tan((camera.fov * Math.PI) / 360);
    const hw = hh * aspect;
    const bottom = CAMERA_Y - hh;
    const top = bottom + hh * (portrait ? 0.42 : 0.5);
    hill.position.set(0, top - GROUND_R, 0);
    backHill.position.set(hw * 0.55, top - 12 + 1.0, -9);
    const treeX = [hw * 0.42, hw * 0.78, -hw * 0.7];
    // Trees stay low on the back hill, below the star field.
    trees.forEach((t, k) => t.position.set(treeX[k] as number, top - 0.35 + (k === 1 ? 0.2 : 0), -6));

    // Luma at the front left of the hill, looking up at the sky.
    const lx = -hw + Math.max(1.1, hw * 0.24);
    lumaPos.set(lx, groundTop(lx, top), 1.2);

    // Star field: the sky above the hill, clear of the edges and of Luma's head.
    const x0 = -hw + 0.9;
    const x1 = hw - 0.9;
    const y0 = top + (portrait ? 2.6 : 2.3);
    const y1 = CAMERA_Y + hh - 0.8;
    const cell = Math.min((x1 - x0) / 3, (y1 - y0) / 3);
    starWorldR = Math.min(0.62, cell * 0.3);
    stars.forEach((s, k) => {
      const p = layout[k] as { u: number; v: number };
      s.group.position.set(x0 + p.u * (x1 - x0), y0 + p.v * (y1 - y0), 0);
      s.group.scale.setScalar(starWorldR / 0.5);
    });
  };
  fit();
  const ro = new ResizeObserver(fit);
  ro.observe(ui.root);

  const tmp = new Vector3();
  const toScreen = (v: Vector3) => {
    tmp.copy(v).project(camera);
    return { x: ((tmp.x + 1) / 2) * viewW, y: ((1 - tmp.y) / 2) * viewH };
  };
  const starScreen = () => stars.map((s) => toScreen(s.group.position));
  const hitRadius = () => {
    const c = toScreen(stars[0]?.group.position ?? new Vector3());
    const e = toScreen((stars[0]?.group.position ?? new Vector3()).clone().add(new Vector3(starWorldR, 0, 0)));
    return Math.max(MIN_HIT_PX, Math.hypot(e.x - c.x, e.y - c.y) * 1.5);
  };

  // ---- animation state (visual only, never used for measurement) ----
  let mode: LumaMode = "idle";
  let modeStart = 0;
  let lastState: RunState = "intro";
  let practice = false;
  let practiceNext = -1; // star the practice hand points at
  let nextFirework = 0;
  let lastTs = 0;
  let raf = 0;
  let lost = false;
  let destroyed = false;
  const setMode = (m: LumaMode, ts: number) => {
    mode = m;
    modeStart = ts;
  };

  const runner = new StarPathRunner(
    { seed: opts.seed, maxLength: opts.maxLength },
    {
      onState: (s: RunState, ts: number, cur: Current | undefined) => {
        lastState = s;
        practice = !!cur?.practice;
        parent.dataset.phase = s;
        parent.dataset.practice = practice ? "1" : "0";
        switch (s) {
          case "practice-intro":
            ui.play(true); // the instruction stays until the child taps (no timer)
            ui.say(STRINGS.practiceIntro);
            setMode("talk", ts);
            audio.babble(BABBLE_MS);
            break;
          case "present":
            ui.say(null);
            ui.handAt(null);
            practiceNext = -1;
            setMode("look", ts);
            break;
          case "recall":
            if (practice && cur) {
              ui.say(STRINGS.yourTurn);
              practiceNext = cur.sequence[0] ?? -1;
            }
            break;
          case "feedback":
            // The same hop and sparkle after every sequence, right or wrong.
            ui.say(null);
            ui.handAt(null);
            practiceNext = -1;
            setMode("hop", ts);
            audio.play("sparkle", 0.5);
            sparkles.spawn(tmp.copy(lumaPos).setY(lumaPos.y + 1.2), 26, SPARK, 2.2, 750, -2.2);
            break;
          case "between":
            ui.play(true);
            ui.say(STRINGS.realIntro);
            audio.play("ready", 0.6);
            setMode("talk", ts);
            break;
          case "done":
            ui.say(STRINGS.done);
            audio.play("done", 0.7);
            nextFirework = ts + 300;
            setMode("celebrate", ts);
            break;
          default:
            break;
        }
      },
      onStarOn: (ts, star, pos) => {
        // Inside runner.frame(ts): drawn by the render call of this same callback.
        const s = stars[star];
        if (s) s.shown = true;
        tones.note(pos);
      },
      onStarOff: (_ts, star) => {
        const s = stars[star];
        if (s) s.shown = false;
      },
      onRecallStar: (_tapMs, _star, pos) => {
        tones.note(pos);
        const cur = runner.current();
        if (cur?.practice) practiceNext = cur.sequence[pos + 1] ?? -1;
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
    tones.unlock();
    if (runner.waitsForReady()) {
      // Only the Start button leaves an instruction: a tap elsewhere, or the second tap of a double tap, does nothing.
      if (ui.playHit(e.clientX, e.clientY) && runner.ready(e.timeStamp) === "ready") {
        ui.play(false);
        audio.play("start", 0.6);
      }
      return;
    }
    const rect = ui.root.getBoundingClientRect();
    const star =
      runner.state === "present" || runner.state === "recall"
        ? pickStar(starScreen(), e.clientX - rect.left, e.clientY - rect.top, hitRadius())
        : null;
    const kind = runner.pointerDown(e.timeStamp, star);
    if (kind === "start") {
      ui.play(false);
      audio.play("start", 0.6);
    }
    // Every recall tap on a star lights it briefly, right or wrong (neutral acknowledgement).
    if ((kind === "next" || kind === "complete" || kind === "wrong") && star !== null) {
      const s = stars[star];
      if (s) s.flashUntil = performance.now() + FLASH_MS;
    }
  };
  const noMenu = (e: Event) => e.preventDefault();
  ui.root.addEventListener("pointerdown", onDown);
  ui.root.addEventListener("contextmenu", noMenu);

  const onLost = (e: Event) => {
    e.preventDefault();
    lost = true;
  };
  const onRestored = () => {
    lost = false;
  };
  canvas.addEventListener("webglcontextlost", onLost);
  canvas.addEventListener("webglcontextrestored", onRestored);

  const head = new Vector3();
  const poseLuma = (ts: number) => {
    const t = ts - modeStart;
    let lift = 0;
    let sy = 1;
    let sx = 1;
    let armL = 0;
    let armR = 0;
    let flap = 0;
    let talking = false;
    let lookUp = 0;
    if (mode === "hop" || mode === "celebrate") {
      const period = mode === "celebrate" ? 720 : 620;
      const p = (t % period) / period;
      const air = p < 0.6 ? p / 0.6 : -1;
      if (air >= 0) {
        lift = (mode === "celebrate" ? 0.5 : 0.3) * 4 * air * (1 - air);
        const s = Math.sin(Math.PI * air);
        sy = 1 + 0.16 * s;
        sx = 1 - 0.08 * s;
      } else {
        const q = (p - 0.6) / 0.4;
        const sq = Math.sin(q * Math.PI) * 0.2;
        sy = 1 - sq;
        sx = 1 + sq * 0.7;
      }
      armL = armR = mode === "celebrate" ? 1.6 + Math.sin(ts * 0.012) * 0.3 : 0.8;
      flap = Math.sin(ts * 0.05) * 0.5;
      if (mode === "hop" && t > 620) setMode("look", ts);
    } else {
      sy = 1 + 0.018 * Math.sin(ts * 0.0032);
      sx = 1 - 0.009 * Math.sin(ts * 0.0032);
      if (mode === "talk") {
        talking = lastState === "practice-intro" || lastState === "between";
        lift = talking ? Math.abs(Math.sin(ts * 0.0105)) * 0.05 : 0;
        armL = armR = talking ? 0.35 + Math.sin(ts * 0.007) * 0.2 : 0;
      }
      if (mode === "look") lookUp = easeOut(t / 400) * 0.28;
      if (lastState === "intro" && !reduced) armR = 2.1 + Math.sin(ts * 0.011) * 0.45; // wave on the start screen
    }
    luma.root.position.set(lumaPos.x, lumaPos.y + lift, lumaPos.z);
    luma.root.rotation.y = 0.45;
    luma.root.rotation.x = -lookUp;
    luma.squash.scale.set(sx, sy, sx);
    (luma.arms[0] as Group).rotation.z = -armL;
    (luma.arms[1] as Group).rotation.z = armR;
    (luma.wings[0] as Group).rotation.y = flap;
    (luma.wings[1] as Group).rotation.y = -flap;
    for (const a of luma.antennae) a.rotation.z = Math.sin(ts * 0.004 + a.position.x * 9) * 0.05 - lift * 0.4;
    luma.mouth.visible = talking;
    luma.smile.visible = !talking;
    if (talking) luma.mouth.scale.set(0.075, 0.025 + 0.045 * Math.abs(Math.sin(ts * 0.021)), 0.03);
    const blinkPhase = ts % 3400;
    let eyeY = blinkPhase < 120 ? 0.12 : 1;
    if (mode === "celebrate") eyeY = Math.min(eyeY, 0.55);
    for (const e of luma.eyes) e.scale.y = eyeY;
    const sh = 1 - Math.min(lift, 0.6) * 0.6;
    shadow.position.set(lumaPos.x, lumaPos.y + 0.02, lumaPos.z + 0.1);
    shadow.scale.set(1.5 * sh, 0.35 * sh, 1);
    head.set(lumaPos.x, lumaPos.y + lift + 1.65, lumaPos.z);
  };

  const frame = (ts: number) => {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (lost) return;
    const dt = lastTs ? Math.min(ts - lastTs, 50) : 16;
    lastTs = ts;

    // 1. Measurement state machine. May light a star for this very frame.
    runner.frame(ts);
    ui.playEnabled(!runner.waitsForReady() || runner.canReady(ts));

    // 2. Visuals.
    const now = performance.now();
    for (const s of stars) {
      const done = lastState === "done";
      const lit = s.shown || now < s.flashUntil || (done && !reduced && Math.sin(ts * 0.004 + s.group.position.x) > 0.3);
      if (lit && !s.wasLit) s.litSince = ts;
      s.wasLit = lit;
      s.mat.color.copy(lit ? STAR_ON : STAR_OFF);
      s.mat.emissive.copy(lit ? STAR_GLOW : BLACK); // keeps the lit yellow bright under toon shading
      s.haloMat.opacity = lit ? 1 : 0;
      // A short pop when a star lights; drawn only, never part of the timing.
      const pop = lit && !reduced ? 1 + 0.16 * (1 - easeOut((ts - s.litSince) / 220)) : 1;
      s.group.scale.setScalar((starWorldR / 0.5) * (lit ? 1.12 * pop : 1));
      s.group.rotation.z = 0;
    }

    poseLuma(ts);

    if (practiceNext >= 0 && lastState === "recall") ui.handAt(toScreen((stars[practiceNext] as StarObj).group.position));
    else if (lastState !== "recall") ui.handAt(null);

    if (lastState === "done" && !reduced && ts >= nextFirework) {
      nextFirework = ts + 600 + Math.random() * 300;
      tmp.set((Math.random() - 0.5) * 6, CAMERA_Y + 1 + Math.random() * 1.5, -2);
      const c = FIRE[Math.floor(Math.random() * FIRE.length)] as Color;
      fireworks.spawn(tmp, 36, [c, c, WHITE], 4, 1400, -0.9, true);
    }
    sparkles.update(dt);
    fireworks.update(dt);

    const h = toScreen(head);
    ui.place(h.x, h.y - 8);
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
      tones.close();
      const mats = new Set<Material>();
      scene.traverse((o) => {
        const m = o as Mesh;
        if (m.geometry) m.geometry.dispose();
        const mat = (m as { material?: Material | Material[] }).material;
        if (Array.isArray(mat)) mat.forEach((x) => mats.add(x));
        else if (mat) mats.add(mat);
      });
      mats.forEach((m) => m.dispose());
      grad.dispose();
      glow.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      ui.destroy();
      delete parent.dataset.phase;
      delete parent.dataset.practice;
    },
  };
}
