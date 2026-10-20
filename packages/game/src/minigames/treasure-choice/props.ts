// Treasure Choice props, built in code from three.js primitives with the Bridge Wait toon style (outline hulls,
// 4-step gradient map): faceted gems, the stepping stone (1 gem now), the little boat with its lantern (2 gems after
// the boat arrives) and the floating treasure chest. No downloaded model, nothing from an existing character.
import {
  AdditiveBlending,
  BoxGeometry,
  type CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  type DataTexture,
  DodecahedronGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  PlaneGeometry,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector2,
} from "three";
import { outline } from "../bridge-wait/luma";

/** Six friendly gem colours; the schedule's cosmetic hue picks one per chest. */
export const GEM_COLORS = [0xff5fa2, 0x4fa8ff, 0x3fd98a, 0xb47cff, 0xffc53d, 0x3fe0e6];
export const gemColor = (hue: number): number => GEM_COLORS[Math.floor(((hue % 360) + 360) % 360 / 60) % 6] as number;

export interface Gem {
  root: Group;
  body: Mesh;
  glow: Sprite;
  setColor: (c: number) => void;
}

let gemGeo: LatheGeometry | null = null;
function gemGeometry(): LatheGeometry {
  if (!gemGeo) {
    // Brilliant-cut profile: pointed pavilion, girdle, flat table. Non-indexed so normals are per facet.
    const g = new LatheGeometry(
      [new Vector2(0.001, -0.3), new Vector2(0.26, 0.03), new Vector2(0.17, 0.17), new Vector2(0.001, 0.17)],
      8,
    );
    gemGeo = g.toNonIndexed() as LatheGeometry;
    gemGeo.computeVertexNormals();
    g.dispose();
  }
  return gemGeo;
}

export function buildGem(grad: DataTexture, outlineMat: MeshBasicMaterial, glowTex: CanvasTexture): Gem {
  const root = new Group();
  const mat = new MeshToonMaterial({ color: new Color(0xffffff), gradientMap: grad, emissive: new Color(0x000000) });
  const body = new Mesh(gemGeometry(), mat);
  outline(body, outlineMat, 1.1);
  const shine = new Mesh(new SphereGeometry(0.035, 8, 6), new MeshBasicMaterial({ color: 0xffffff }));
  shine.position.set(-0.07, 0.12, 0.12);
  body.add(shine);
  const glowMat = new SpriteMaterial({ map: glowTex, transparent: true, opacity: 0.55, blending: AdditiveBlending, depthWrite: false });
  const glow = new Sprite(glowMat);
  glow.scale.setScalar(1.15);
  glow.position.z = -0.08;
  root.add(glow, body);
  const setColor = (c: number) => {
    const col = new Color(c);
    mat.color.copy(col);
    mat.emissive.copy(col).multiplyScalar(0.28);
    glowMat.color.copy(col).lerp(new Color(0xffffff), 0.35);
  };
  return { root, body, glow, setColor };
}

export interface Stone {
  root: Group;
  gem: Gem;
  ring: Mesh;
}

/** A mossy stepping stone in the river with one gem floating above it. */
export function buildStone(grad: DataTexture, outlineMat: MeshBasicMaterial, glowTex: CanvasTexture): Stone {
  const toon = (c: number) => new MeshToonMaterial({ color: new Color(c), gradientMap: grad });
  const root = new Group();
  const rock = new Mesh(new DodecahedronGeometry(1, 1), toon(0x9089c8));
  rock.scale.set(0.5, 0.24, 0.42);
  outline(rock, outlineMat, 1.08);
  const moss = new Mesh(new SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), toon(0x5cc77a));
  moss.scale.set(0.36, 0.1, 0.3);
  moss.position.y = 0.17;
  root.add(rock, moss);
  const ring = waterRing(glowTex);
  root.add(ring);
  const gem = buildGem(grad, outlineMat, glowTex);
  gem.root.position.y = 0.72;
  root.add(gem.root);
  return { root, gem, ring };
}

export interface Boat {
  root: Group;
  hull: Group;
  gems: Gem[];
  lanternGlass: MeshBasicMaterial;
  lanternHalo: Sprite;
  ring: Mesh;
}

export const LANTERN_DARK = new Color(0x6a5a92);
export const LANTERN_FULL = new Color(0xffe58a);

/** A little round boat with a mast lantern (the gentle timer) and two gems on board. */
export function buildBoat(grad: DataTexture, outlineMat: MeshBasicMaterial, glowTex: CanvasTexture): Boat {
  const toon = (c: number) => new MeshToonMaterial({ color: new Color(c), gradientMap: grad });
  const root = new Group();
  const hull = new Group();
  root.add(hull);
  const shell = new Mesh(new SphereGeometry(1, 24, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), toon(0xc8834e));
  shell.scale.set(0.62, 0.34, 0.4);
  shell.position.y = 0.2;
  outline(shell, outlineMat, 1.06);
  const rim = new Mesh(new CylinderGeometry(1, 1, 0.06, 24, 1, true), toon(0x8a5a3a));
  rim.scale.set(0.62, 1, 0.4);
  rim.position.y = 0.2;
  const stripe = new Mesh(new CylinderGeometry(1, 1, 0.05, 24, 1, true), toon(0xfff1d6));
  stripe.scale.set(0.6, 1, 0.385);
  stripe.position.y = 0.08;
  const mast = new Mesh(new CylinderGeometry(0.025, 0.03, 0.95, 6), toon(0x6b4232));
  mast.position.set(-0.3, 0.62, -0.05);
  const flag = new Mesh(new ConeGeometry(0.13, 0.3, 3), toon(0x3fd6c4));
  flag.rotation.z = -Math.PI / 2;
  flag.position.set(-0.15, 0.98, -0.05);
  outline(flag, outlineMat, 1.12);
  const lanternGlass = new MeshBasicMaterial({ color: LANTERN_DARK.clone() });
  const lamp = new Mesh(new SphereGeometry(0.18, 16, 12), lanternGlass);
  lamp.position.set(-0.3, 1.2, -0.05);
  outline(lamp, outlineMat, 1.14);
  const cap = new Mesh(new ConeGeometry(0.22, 0.16, 6), toon(0x5a3d6b));
  cap.position.set(-0.3, 1.42, -0.05);
  outline(cap, outlineMat, 1.12);
  const lanternHalo = new Sprite(
    new SpriteMaterial({ map: glowTex, color: 0xffc457, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }),
  );
  lanternHalo.position.set(-0.3, 1.2, 0);
  lanternHalo.scale.setScalar(0.9);
  hull.add(shell, rim, stripe, mast, flag, lamp, cap, lanternHalo);
  const gems: Gem[] = [];
  for (const dx of [0.02, 0.34]) {
    const gem = buildGem(grad, outlineMat, glowTex);
    gem.root.scale.setScalar(0.85);
    gem.root.position.set(dx, 0.55, 0.05);
    hull.add(gem.root);
    gems.push(gem);
  }
  const ring = waterRing(glowTex);
  ring.scale.set(2.0, 1.5, 1);
  root.add(ring);
  return { root, hull, gems, lanternGlass, lanternHalo, ring };
}

export interface Chest {
  root: Group;
  lid: Group;
  inner: Sprite;
}

/** A small treasure chest floating on the river; the lid hinges open at the back. */
export function buildChest(grad: DataTexture, outlineMat: MeshBasicMaterial, glowTex: CanvasTexture): Chest {
  const toon = (c: number) => new MeshToonMaterial({ color: new Color(c), gradientMap: grad });
  const root = new Group();
  const wood = toon(0xb9773f);
  const gold = toon(0xffcc4d);
  const base = new Mesh(new BoxGeometry(0.62, 0.34, 0.42), wood);
  base.position.y = 0.17;
  outline(base, outlineMat, 1.06);
  root.add(base);
  for (const x of [-0.22, 0.22]) {
    const band = new Mesh(new BoxGeometry(0.06, 0.36, 0.44), gold);
    band.position.set(x, 0.17, 0);
    root.add(band);
  }
  const lock = new Mesh(new BoxGeometry(0.1, 0.12, 0.04), gold);
  lock.position.set(0, 0.28, 0.225);
  outline(lock, outlineMat, 1.15);
  root.add(lock);
  const lid = new Group();
  lid.position.set(0, 0.34, -0.21);
  const top = new Mesh(new CylinderGeometry(0.21, 0.21, 0.62, 16, 1, false, 0, Math.PI), wood);
  top.rotation.z = Math.PI / 2;
  top.rotation.y = Math.PI / 2;
  top.position.set(0, 0, 0.21);
  outline(top, outlineMat, 1.06);
  lid.add(top);
  for (const x of [-0.22, 0.22]) {
    const band = new Mesh(new CylinderGeometry(0.22, 0.22, 0.06, 16, 1, false, 0, Math.PI), gold);
    band.rotation.z = Math.PI / 2;
    band.rotation.y = Math.PI / 2;
    band.position.set(x, 0, 0.21);
    lid.add(band);
  }
  root.add(lid);
  const inner = new Sprite(
    new SpriteMaterial({ map: glowTex, color: 0xfff0a8, transparent: true, opacity: 0, blending: AdditiveBlending, depthWrite: false }),
  );
  inner.position.set(0, 0.42, 0);
  inner.scale.setScalar(1.3);
  root.add(inner);
  return { root, lid, inner };
}

/** Soft glowing ring on the water under an option: shows "this can be tapped" without words. */
function waterRing(glowTex: CanvasTexture): Mesh {
  const m = new Mesh(
    new PlaneGeometry(1.5, 1.5),
    new MeshBasicMaterial({ map: glowTex, color: 0xfff0b0, transparent: true, opacity: 0.5, blending: AdditiveBlending, depthWrite: false }),
  );
  m.rotation.x = -Math.PI / 2;
  m.position.y = 0.02;
  return m;
}
