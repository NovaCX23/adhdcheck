// Treasure Choice in 3D (three.js). Browser only: imported lazily by mount.ts. Same river valley, Luma and toon
// style as Bridge Wait (world.ts and luma.ts are imported from there unchanged).
//
// Timing (research/03 section 2): one requestAnimationFrame loop. Each callback first calls runner.frame(ts);
// when the offer is due, the runner calls onOffer inside that call, which makes both options visible; the same
// callback then renders, so ts is the onset of the frame that first draws the options. Responses come from a
// native pointerdown listener on the game container (event.timeStamp, never click).
import {
  Color,
  DataTexture,
  DirectionalLight,
  Fog,
  HemisphereLight,
  type Material,
  type Mesh,
  type MeshBasicMaterial,
  NearestFilter,
  PerspectiveCamera,
  type PointsMaterial,
  RedFormat,
  Scene,
  type SpriteMaterial,
  Vector3,
  WebGLRenderer,
  type Float32BufferAttribute,
  type Group,
} from "three";
import { GameAudio } from "../bridge-wait/audio";
import { buildLuma, makeOutlineMaterial, type LumaRig } from "../bridge-wait/luma";
import { LANTERN_ON, WATER_Y, buildWorld, groundY, type World } from "../bridge-wait/world";
import { preDelayMs } from "./logic";
import { Particles } from "./particles";
import { LANTERN_DARK, LANTERN_FULL, buildBoat, buildChest, buildGem, buildStone, gemColor, type Gem } from "./props";
import { TreasureChoiceRunner, type QueueItem, type RunState } from "./runner";
import { isPrimaryPointer } from "../../pointer";
import { STRINGS } from "./strings";
import type { Choice, TreasureChoiceResult } from "./types";
import { buildUi } from "./ui";

export interface SceneOptions {
  seed: number;
  choices?: number;
  assetBase: string;
  onComplete?: (result: TreasureChoiceResult) => void;
}

/** Options sit on the river in front of the bridge, mirrored left and right of Luma. */
const OPT_X = 1.75;
const OPT_Z = 2.0;
const CHEST_Z = 2.35;
/** Where the boat arrives: beside Luma on its right and in front of it, so the lantern stays in view. */
const DOCK = new Vector3(1.3, WATER_Y, 1.55);
const TARGET = new Vector3(0, 1.0, 0.6);
const VIEW_DIR = new Vector3(0, 0.3, 1).normalize();
/** Taps closer than this share of the width to the centre line choose nothing. */
const DEAD_ZONE = 0.06;

const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);
const easeOut = (t: number) => 1 - Math.pow(1 - clamp01(t), 3);
/** Smoothstep: steady progress in the middle, soft start and stop (reads well as a timer). */
const smooth = (t: number) => {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
};
const easeInOut = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};

type LumaMode = "idle" | "wave" | "talk" | "hop" | "celebrate" | "happy";

interface Flight {
  gem: Gem;
  from: Vector3;
  to: Vector3;
  start: number;
  dur: number;
  arc: number;
  color: number;
  done?: () => void;
}

export function createTreasureChoiceScene(parent: HTMLElement, opts: SceneOptions): { destroy: () => void } {
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
  // Bridge lanterns: a steady, soft warm glow (decoration here, never a cue).
  world.lanterns.glass.color.copy(LANTERN_ON);
  world.lanterns.halo.opacity = 0.32;
  world.lanterns.reflection.opacity = 0.22;
  world.lanterns.light.intensity = 1.6;
  for (const h of world.lanterns.halos) h.scale.setScalar(1.4);

  const luma: LumaRig = buildLuma(grad, outlineMat);
  luma.root.scale.setScalar(1.15);
  scene.add(luma.root);
  // Luma hovers just in front of the bridge's front rail, so no rope crosses its face.
  const LUMA_X = 0;
  const LUMA_Z = 1.0;
  const HOVER = 0.42;

  const stone = buildStone(grad, outlineMat, world.glow);
  const stoneHome = new Vector3(-OPT_X, WATER_Y, OPT_Z);
  stone.root.position.copy(stoneHome);
  const boat = buildBoat(grad, outlineMat, world.glow);
  const boatHome = new Vector3(OPT_X, WATER_Y, OPT_Z);
  boat.root.position.copy(boatHome);
  boat.root.rotation.y = -0.35;
  const chest = buildChest(grad, outlineMat, world.glow);
  chest.root.position.set(0, WATER_Y, CHEST_Z);
  stone.root.visible = boat.root.visible = chest.root.visible = false;
  scene.add(stone.root, boat.root, chest.root);

  const travellers = [buildGem(grad, outlineMat, world.glow), buildGem(grad, outlineMat, world.glow)];
  for (const t of travellers) {
    t.root.visible = false;
    scene.add(t.root);
  }

  const sparkles = new Particles(200, 0.22, world.glow);
  const fireworks = new Particles(800, 0.62, world.glow);
  scene.add(sparkles.points, fireworks.points);
  const WHITE = new Color(0xffffff);
  const FIRE = [new Color(0xffd66b), new Color(0xff8fc0), new Color(0x8ff0d8), new Color(0x9fc4ff), new Color(0xd2a8ff)];

  // ---- visual state (never used for measurement) ----
  let mode: LumaMode = "wave";
  let modeStart = 0;
  let turnTarget = 0;
  let turn = 0;
  let lastState: RunState = "intro";
  let stateStart = 0;
  let item: QueueItem | undefined;
  let color = 0xffffff;
  let choice: Choice | null = null;
  let choiceAt = 0;
  let preMs = 0;
  let pendingChoice = false;
  let offerAt = -1;
  let rewardAt = -1;
  let fireflyTarget = 1;
  let fireflyLevel = 0;
  let nextFirework = 0;
  let lastTs = 0;
  let raf = 0;
  let lost = false;
  let destroyed = false;
  let showHand = false;
  const flights: Flight[] = [];
  const tmp = new Vector3();
  const head = new Vector3();
  const handV = new Vector3();
  const gemV = new Vector3();

  const setMode = (m: LumaMode, ts: number) => {
    mode = m;
    modeStart = ts;
  };

  const resetProps = () => {
    stone.root.position.copy(stoneHome);
    stone.root.scale.setScalar(1);
    stone.gem.root.visible = true;
    stone.gem.root.position.set(0, 0.72, 0);
    boat.root.position.copy(boatHome);
    boat.root.rotation.y = -0.35;
    boat.root.scale.setScalar(1);
    for (const g of boat.gems) g.root.visible = true;
    boat.lanternGlass.color.copy(LANTERN_DARK);
    (boat.lanternHalo.material as SpriteMaterial).opacity = 0.15;
    stone.root.visible = boat.root.visible = false;
    for (const r of [stone.ring, boat.ring]) r.visible = true;
  };

  const lumaTummy = () => new Vector3(LUMA_X, groundY(LUMA_X) + HOVER + 0.6, LUMA_Z + 0.55);

  const runner = new TreasureChoiceRunner(
    { seed: opts.seed, choices: opts.choices },
    {
      onState: (s: RunState, ts: number, it: QueueItem | undefined) => {
        lastState = s;
        stateStart = ts;
        item = it;
        parent.dataset.phase = s;
        parent.dataset.practice = it?.practice ? "1" : "0";
        switch (s) {
          case "practice-intro":
            ui.play(false);
            ui.bag(true);
            ui.say(STRINGS.practiceIntro);
            setMode("hop", ts);
            break;
          case "chest": {
            resetProps();
            choice = null;
            rewardAt = -1;
            offerAt = -1;
            color = gemColor(it?.sched.gemHue ?? 0);
            stone.gem.setColor(color);
            for (const g of boat.gems) g.setColor(color);
            for (const t of travellers) t.setColor(color);
            chest.root.visible = true;
            chest.lid.rotation.x = 0;
            fireflyTarget = 0;
            const only = it?.sched.only;
            const line = only === "now" ? STRINGS.practiceNow : only === "later" ? STRINGS.practiceLater : STRINGS.offer;
            ui.say(line);
            audio.babble(1400);
            setMode("talk", ts);
            turnTarget = 0;
            break;
          }
          case "wait":
            ui.say(null);
            if (mode === "talk") setMode("idle", ts);
            break;
          case "rest":
            fireflyTarget = 1;
            break;
          case "between":
            ui.say(STRINGS.realIntro);
            audio.play("ready", 0.6);
            setMode("hop", ts);
            turnTarget = 0;
            break;
          case "done":
            ui.say(STRINGS.done);
            audio.play("done", 0.7);
            fireflyTarget = 1;
            nextFirework = ts + 300;
            setMode("celebrate", ts);
            turnTarget = 0;
            break;
          default:
            break;
        }
      },
      onOffer: (ts, it) => {
        // Inside runner.frame(ts): drawn by the render call of this same callback (the offer onset).
        const only = it.sched.only;
        stone.root.visible = only !== "later";
        boat.root.visible = only !== "now";
        offerAt = ts;
        showHand = it.practice;
      },
      onChoice: (c) => {
        // From the pointerdown handler: the visuals follow in the next frame.
        choice = c;
        pendingChoice = true;
        showHand = false;
        ui.handAt(null);
        audio.play("start", 0.55);
      },
      onReward: (ts, it, c) => {
        rewardAt = ts;
        const to = bagWorld();
        const sources: Vector3[] = [];
        if (c === "now") {
          stone.gem.root.getWorldPosition(tmp);
          sources.push(tmp.clone());
          stone.gem.root.visible = false;
        } else {
          for (const g of boat.gems) {
            g.root.getWorldPosition(tmp);
            sources.push(tmp.clone());
            g.root.visible = false;
          }
        }
        sources.forEach((from, k) => {
          const gem = travellers[k] as Gem;
          gem.root.visible = true;
          gem.root.position.copy(from);
          flights.push({
            gem,
            from,
            to: to.clone(),
            start: ts + k * 140,
            dur: 700,
            arc: 0.5,
            color,
            done: () => {
              ui.addGems([color]);
              audio.play("sparkle", 0.5);
              sparkles.spawn(lumaTummy(), 12, [new Color(color), WHITE], 1.8, 600, -2.0);
            },
          });
        });
        void it;
        setMode("happy", ts);
      },
      onComplete: (r) => opts.onComplete?.(r),
    },
  );
  parent.dataset.phase = "intro";
  ui.say(STRINGS.start);
  ui.play(true);

  /** Which option is under a pointer, by screen half (big targets, a small dead zone on the centre line). */
  const sideAt = (clientX: number): Choice | null => {
    const r = ui.root.getBoundingClientRect();
    const u = (clientX - r.left) / Math.max(1, r.width);
    if (Math.abs(u - 0.5) < DEAD_ZONE) return null;
    return u < 0.5 ? "now" : "later";
  };

  const onDown = (e: PointerEvent) => {
    if (!isPrimaryPointer(e)) return; // a second finger is not a response
    audio.unlock(); // inside the gesture: required by iOS Safari
    const kind = runner.pointerDown(e.timeStamp, sideAt(e.clientX));
    if (kind === "start") audio.play("start", 0.6);
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

  const target = TARGET.clone();
  let viewW = 1;
  let viewH = 1;
  let camBase = new Vector3();
  const fit = () => {
    const w = Math.max(1, ui.root.clientWidth);
    const h = Math.max(1, ui.root.clientHeight);
    viewW = w;
    viewH = h;
    const aspect = w / h;
    const portrait = aspect < 1;
    camera.fov = portrait ? 50 : 38;
    // Half-width to keep in view at the target: both options plus a margin.
    const halfW = portrait ? 3.3 : 4.6;
    const tanH = Math.tan((camera.fov * Math.PI) / 360);
    const d = Math.max(8.5, halfW / (tanH * aspect));
    camera.aspect = aspect;
    target.copy(TARGET);
    // Portrait: aim above the scene so it sits lower, under the bag and the bubble, nearer the child's thumbs.
    if (portrait) target.y += 1.7;
    camera.position.copy(TARGET).addScaledVector(VIEW_DIR, d);
    camBase = camera.position.clone();
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

  /** A world point just in front of the camera, under the bag opening on screen: where flying gems go. */
  const bagWorld = () => {
    const m = ui.bagMouth();
    const v = new Vector3((m.x / viewW) * 2 - 1, -(m.y / viewH) * 2 + 1, 0.5).unproject(camera);
    const dir = v.sub(camera.position).normalize();
    return camera.position.clone().addScaledVector(dir, 4);
  };

  const toScreen = (v: Vector3) => {
    tmp.copy(v).project(camera);
    return { x: ((tmp.x + 1) / 2) * viewW, y: ((1 - tmp.y) / 2) * viewH };
  };

  const poseLuma = (ts: number) => {
    const t = ts - modeStart;
    let lift = 0;
    let sy = 1 + 0.018 * Math.sin(ts * 0.0032);
    let sx = 1 - 0.009 * Math.sin(ts * 0.0032);
    let armL = 0;
    let armR = 0;
    let flap = 0;
    let talking = false;
    let happy = false;
    if (mode === "hop" || mode === "celebrate") {
      const period = mode === "celebrate" ? 720 : 620;
      const p = (t % period) / period;
      const air = p < 0.6 ? p / 0.6 : -1;
      if (air >= 0) {
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
      armL = armR = mode === "celebrate" ? 1.6 + Math.sin(ts * 0.012) * 0.3 : 0.8;
      flap = Math.sin(ts * 0.05) * 0.5;
      happy = mode === "celebrate";
      if (mode === "hop" && t > 1250) setMode("idle", ts);
    } else if (mode === "happy") {
      // One cheerful hop with arms up when the gems land: identical for one gem and for two.
      const p = clamp01(t / 520);
      lift = 0.32 * 4 * p * (1 - p);
      const s = Math.sin(Math.PI * p);
      sy = 1 + 0.14 * s;
      sx = 1 - 0.07 * s;
      armL = armR = 1.5 * Math.sin(Math.PI * clamp01(t / 900));
      happy = true;
      if (t > 1000) setMode("idle", ts);
    } else if (mode === "wave") {
      armR = 2.1 + Math.sin(ts * 0.011) * 0.45;
      if (!reduced) flap = Math.sin(ts * 0.004) * 0.12;
    } else if (mode === "talk") {
      talking = t < 1300;
      lift = talking ? Math.abs(Math.sin(ts * 0.0105)) * 0.05 : 0;
      armL = armR = talking ? 0.35 + Math.sin(ts * 0.007) * 0.2 : 0;
    } else {
      // idle: a calm sway; while the boat is coming Luma rocks gently, watching it.
      if (lastState === "wait") {
        armL = armR = 0.25 + Math.sin(ts * 0.004) * 0.08;
        lift = Math.abs(Math.sin(ts * 0.0035)) * 0.03;
      }
    }

    turn += (turnTarget - turn) * 0.08;
    // Hovering: a slow float and a soft, steady wing flutter (never fast, never flashing).
    const float = reduced ? 0 : Math.sin(ts * 0.0021) * 0.05;
    if (flap === 0 && !reduced) flap = Math.sin(ts * 0.018) * 0.22;
    luma.root.position.set(LUMA_X, groundY(LUMA_X) + HOVER + float + lift, LUMA_Z);
    luma.root.rotation.y = turn;
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
    if (happy) eyeY = Math.min(eyeY, 0.55);
    for (const e of luma.eyes) e.scale.y = eyeY;
    const shadowScale = 1.2 * (1 - Math.min(lift + float, 0.6) * 0.6);
    world.shadow.position.set(LUMA_X, WATER_Y + 0.012, LUMA_Z + 0.05);
    world.shadow.scale.set(shadowScale, shadowScale, 1);
    head.set(LUMA_X, groundY(LUMA_X) + HOVER + float + lift + 1.6, LUMA_Z);
  };

  const animateProps = (ts: number) => {
    const bob = (k: number) => Math.sin(ts * 0.0022 + k) * 0.035;
    // Chest: rises, opens, then sinks after the choice.
    if (chest.root.visible) {
      const t = ts - stateStart;
      if (lastState === "chest") {
        const up = easeOut(t / 500);
        chest.root.position.y = WATER_Y - 0.45 + 0.45 * up + bob(0);
        chest.root.scale.setScalar(0.6 + 0.4 * up);
        const open = easeOut((t - 650) / 450);
        chest.lid.rotation.x = -1.25 * open;
        (chest.inner.material as SpriteMaterial).opacity = open * 0.9;
        if (t >= 650 && t - (ts - lastTs) < 650) {
          audio.play("sparkle", 0.35);
          tmp.set(0, WATER_Y + 0.5, CHEST_Z);
          sparkles.spawn(tmp, 18, [new Color(color), WHITE], 1.6, 600, -1.5);
        }
      } else if (lastState === "offer") {
        chest.root.position.y = WATER_Y + bob(0);
      } else {
        const k = easeInOut((ts - choiceAt) / 700);
        chest.lid.rotation.x = -1.25 * (1 - k);
        (chest.inner.material as SpriteMaterial).opacity = 0.9 * (1 - k);
        chest.root.position.y = WATER_Y - 0.5 * k + bob(0);
        chest.root.scale.setScalar(1 - 0.4 * k);
        if (k >= 1) chest.root.visible = false;
      }
    }

    // Options: settle in on the offer frame, bob, and glow rings breathe while the choice is open.
    const settle = offerAt >= 0 ? 0.85 + 0.15 * easeOut((ts - offerAt) / 220) : 1;
    const ring = 0.6 + 0.15 * Math.sin(ts * 0.004);
    if (stone.root.visible) {
      stone.root.position.y = WATER_Y + bob(1) * 0.4;
      if (choice === null) {
        stone.root.scale.setScalar(settle);
        stone.gem.root.position.y = 0.72 + bob(2) * 2;
        stone.gem.root.rotation.y = ts * 0.0012;
        (stone.ring.material as MeshBasicMaterial).opacity = ring;
      }
    }
    if (boat.root.visible) {
      boat.hull.rotation.z = Math.sin(ts * 0.0019) * 0.05;
      boat.hull.position.y = bob(3);
      for (const g of boat.gems) g.root.rotation.y = ts * 0.0012;
      if (choice === null) {
        boat.root.scale.setScalar(settle);
        (boat.ring.material as MeshBasicMaterial).opacity = ring;
      }
    }

    if (choice !== null) {
      stone.ring.visible = boat.ring.visible = false;
      // The option not taken slips away quietly; the chosen one plays out the wait.
      const away = easeInOut((ts - choiceAt) / 400);
      if (choice === "now" && boat.root.visible && rewardAt < 0) {
        boat.root.scale.setScalar(Math.max(0.001, 1 - away));
        if (away >= 1) boat.root.visible = false;
      }
      if (choice === "later" && stone.root.visible) {
        stone.root.scale.setScalar(Math.max(0.001, 1 - away));
        if (away >= 1) stone.root.visible = false;
      }
      const p = clamp01((ts - choiceAt) / preMs);
      if (choice === "now" && rewardAt < 0) {
        // The gem floats from the stone to Luma over the whole short wait.
        const from = new Vector3(0, 0.72, 0);
        stone.gem.root.position.copy(from);
        stone.gem.root.getWorldPosition(gemV);
        const k = smooth(p);
        const end = lumaTummy().add(new Vector3(-0.55, 0.35, 0.1));
        const local = stone.root.worldToLocal(gemV.lerp(end, k).add(new Vector3(0, Math.sin(Math.PI * k) * 0.5, 0)));
        stone.gem.root.position.copy(local);
        stone.gem.root.rotation.y = ts * 0.003;
        turnTarget = -0.35 * (1 - k);
      }
      if (choice === "later" && rewardAt < 0) {
        // The boat sails in to the bridge while its lantern fills with light: the gentle timer.
        const k = smooth(p);
        boat.root.position.lerpVectors(boatHome, DOCK, k);
        boat.root.rotation.y = -0.35 - 0.5 * k;
        boat.lanternGlass.color.copy(LANTERN_DARK).lerp(LANTERN_FULL, p);
        (boat.lanternHalo.material as SpriteMaterial).opacity = 0.15 + p * 0.85;
        boat.lanternHalo.scale.setScalar(0.7 + 1.1 * p);
        turnTarget = 0.3;
      }
      if (rewardAt >= 0) {
        turnTarget = 0;
        const k = easeInOut((ts - rewardAt - 300) / 900);
        if (choice === "later" && boat.root.visible) {
          boat.root.position.x = DOCK.x + 2.4 * k;
          boat.root.position.z = DOCK.z + 1.0 * k;
          boat.root.scale.setScalar(Math.max(0.001, 1 - k));
          if (k >= 1) boat.root.visible = false;
        }
        if (choice === "now" && stone.root.visible) {
          stone.root.position.y = WATER_Y - 0.4 * k;
          stone.root.scale.setScalar(Math.max(0.001, 1 - k));
          if (k >= 1) stone.root.visible = false;
        }
      }
    }

    for (let f = flights.length - 1; f >= 0; f--) {
      const fl = flights[f] as Flight;
      const k = (ts - fl.start) / fl.dur;
      if (k < 0) continue;
      const e = easeInOut(k);
      fl.gem.root.position.lerpVectors(fl.from, fl.to, e);
      fl.gem.root.position.y += Math.sin(Math.PI * e) * fl.arc;
      fl.gem.root.scale.setScalar(1 - 0.45 * e);
      fl.gem.root.rotation.y = ts * 0.006;
      if (k >= 1) {
        fl.gem.root.visible = false;
        fl.gem.root.scale.setScalar(1);
        flights.splice(f, 1);
        fl.done?.();
      }
    }
  };

  const frame = (ts: number) => {
    if (destroyed) return;
    raf = requestAnimationFrame(frame);
    if (lost) return;
    const dt = lastTs ? Math.min(ts - lastTs, 50) : 16;

    // 1. Measurement state machine. May show the options for this very frame (offer onset).
    runner.frame(ts);

    // 2. Visuals. The phase attribute (for tests and the dev page) is re-asserted every frame: under React strict
    // mode a cancelled first mount is destroyed after the second one wrote it.
    if (parent.dataset.phase !== lastState) parent.dataset.phase = lastState;
    if (pendingChoice && choice) {
      pendingChoice = false;
      choiceAt = ts;
      preMs = item ? preDelayMs(choice, item.sched) : 1;
    }
    animateProps(ts);
    poseLuma(ts);

    if (showHand && item) {
      const only = item.sched.only;
      const src = only === "later" ? boat.gems[0]?.root : stone.gem.root;
      if (src) {
        src.getWorldPosition(handV);
        const p = toScreen(handV);
        ui.handAt({ x: p.x, y: p.y + 18 });
      }
    }

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
        tmp.set((Math.random() - 0.5) * 8, 3.1 + Math.random() * 1.3, -0.6 - Math.random());
        const c = FIRE[Math.floor(Math.random() * FIRE.length)] as Color;
        fireworks.spawn(tmp, 40, [c, c, WHITE], 4.2, 1500, -0.9, true);
      }
    }
    sparkles.update(dt);
    fireworks.update(dt);
    world.water.offset.y = (ts * 0.000012) % 1;

    if (!reduced && (lastState === "intro" || lastState === "done")) {
      camera.position.x = camBase.x + Math.sin(ts * 0.00025) * 0.35;
      camera.lookAt(target);
    } else if (camera.position.x !== camBase.x) {
      camera.position.x = camBase.x + (camera.position.x - camBase.x) * 0.9;
      if (Math.abs(camera.position.x - camBase.x) < 0.001) camera.position.x = camBase.x;
      camera.lookAt(target);
    }

    tmp.copy(head);
    const hp = toScreen(tmp);
    ui.place(hp.x, hp.y - 8);
    lastTs = ts;
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
      mats.forEach((m) => m.dispose());
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
