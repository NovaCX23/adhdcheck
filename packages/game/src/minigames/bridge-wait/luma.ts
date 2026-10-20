// Luma, the firefly keeper: an original creature built from rounded primitives with toon shading.
// Round mint body, cream belly, very big eyes, rosy cheeks, two antennae with soft glowing tips, small
// translucent wings and little feet. Not modelled on any existing character.
import {
  BackSide,
  Color,
  type DataTexture,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshToonMaterial,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  CatmullRomCurve3,
  Vector3,
} from "three";

export const OUTLINE = 0x1d1640;

export interface LumaRig {
  root: Group;
  /** Squash and stretch pivot, origin at the feet. */
  squash: Group;
  eyes: Group[];
  smile: Mesh;
  mouth: Mesh;
  wings: Group[];
  arms: Group[];
  antennae: Group[];
}

export function outline(mesh: Mesh, mat: MeshBasicMaterial, scale = 1.07): Mesh {
  const hull = new Mesh(mesh.geometry, mat);
  hull.scale.setScalar(scale);
  hull.renderOrder = -1;
  mesh.add(hull);
  return hull;
}

export function makeOutlineMaterial(): MeshBasicMaterial {
  return new MeshBasicMaterial({ color: OUTLINE, side: BackSide });
}

export function buildLuma(grad: DataTexture, outlineMat: MeshBasicMaterial): LumaRig {
  const toon = (c: number) => new MeshToonMaterial({ color: new Color(c), gradientMap: grad });
  const body = toon(0x3fd6c4);
  const dark = toon(0x1f9e95);
  const belly = toon(0xfff1cc);

  const root = new Group();
  const squash = new Group();
  root.add(squash);

  const sphere = new SphereGeometry(1, 32, 24);

  const torso = new Mesh(sphere, body);
  torso.scale.set(0.6, 0.56, 0.56);
  torso.position.y = 0.62;
  outline(torso, outlineMat, 1.06);
  squash.add(torso);

  const tummy = new Mesh(sphere, belly);
  tummy.scale.set(0.36, 0.25, 0.2);
  tummy.position.set(0, 0.36, 0.41);
  squash.add(tummy);

  // Feet
  for (const s of [-1, 1]) {
    const foot = new Mesh(sphere, dark);
    foot.scale.set(0.19, 0.11, 0.24);
    foot.position.set(0.24 * s, 0.09, 0.12);
    outline(foot, outlineMat, 1.12);
    squash.add(foot);
  }

  // Arms (stubby), pivot at the shoulder so they can wave.
  const arms: Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(0.52 * s, 0.6, 0.06);
    const arm = new Mesh(sphere, body);
    arm.scale.set(0.11, 0.2, 0.11);
    arm.position.set(0.06 * s, -0.12, 0);
    arm.rotation.z = 0.5 * s;
    outline(arm, outlineMat, 1.14);
    pivot.add(arm);
    squash.add(pivot);
    arms.push(pivot);
  }

  // Eyes: big white, dark pupil, two highlights. Group per eye so a blink scales it.
  const white = new MeshBasicMaterial({ color: 0xffffff });
  const pupilMat = new MeshBasicMaterial({ color: 0x1e1838 });
  const eyes: Group[] = [];
  for (const s of [-1, 1]) {
    const eye = new Group();
    eye.position.set(0.21 * s, 0.78, 0.44);
    const ball = new Mesh(sphere, white);
    ball.scale.set(0.19, 0.22, 0.12);
    outline(ball, outlineMat, 1.1);
    const pupil = new Mesh(sphere, pupilMat);
    pupil.scale.set(0.12, 0.145, 0.08);
    pupil.position.set(0.015 * s, -0.01, 0.07);
    const hi = new Mesh(sphere, white);
    hi.scale.setScalar(0.045);
    hi.position.set(0.045 * s, 0.06, 0.135);
    const hi2 = new Mesh(sphere, white);
    hi2.scale.setScalar(0.022);
    hi2.position.set(-0.035 * s, -0.05, 0.14);
    eye.add(ball, pupil, hi, hi2);
    squash.add(eye);
    eyes.push(eye);
  }

  // Cheeks
  const cheekMat = new MeshBasicMaterial({ color: 0xff8fb3, transparent: true, opacity: 0.85 });
  for (const s of [-1, 1]) {
    const c = new Mesh(sphere, cheekMat);
    c.scale.set(0.085, 0.05, 0.03);
    c.position.set(0.38 * s, 0.6, 0.43);
    c.rotation.y = 0.5 * s;
    squash.add(c);
  }

  // Mouth: a smile arc when quiet, an open oval when talking.
  const mouthMat = new MeshBasicMaterial({ color: 0x4a1838 });
  const smile = new Mesh(new TorusGeometry(0.075, 0.018, 8, 20, Math.PI), mouthMat);
  smile.rotation.z = Math.PI;
  smile.position.set(0, 0.62, 0.555);
  squash.add(smile);
  const mouth = new Mesh(sphere, mouthMat);
  mouth.scale.set(0.075, 0.05, 0.03);
  mouth.position.set(0, 0.59, 0.545);
  mouth.visible = false;
  squash.add(mouth);

  // Antennae with soft glowing tips (constant glow, never flashing).
  const stalkMat = toon(0x1f9e95);
  const tipMat = new MeshBasicMaterial({ color: 0xeaffa8 });
  const antennae: Group[] = [];
  for (const s of [-1, 1]) {
    const g = new Group();
    g.position.set(0.14 * s, 1.08, 0.05);
    const curve = new CatmullRomCurve3([
      new Vector3(0, 0, 0),
      new Vector3(0.05 * s, 0.17, 0.02),
      new Vector3(0.16 * s, 0.3, 0.05),
    ]);
    const stalk = new Mesh(new TubeGeometry(curve, 10, 0.022, 6, false), stalkMat);
    const tip = new Mesh(sphere, tipMat);
    tip.scale.setScalar(0.075);
    tip.position.set(0.16 * s, 0.31, 0.05);
    outline(tip, outlineMat, 1.25);
    g.add(stalk, tip);
    squash.add(g);
    antennae.push(g);
  }

  // Wings: translucent, behind the body, pivot at the back.
  const wingMat = new MeshBasicMaterial({ color: 0xdff6ff, transparent: true, opacity: 0.82, depthWrite: false });
  const wings: Group[] = [];
  for (const s of [-1, 1]) {
    const pivot = new Group();
    pivot.position.set(0.18 * s, 0.86, -0.36);
    const w = new Mesh(sphere, wingMat);
    w.scale.set(0.32, 0.17, 0.03);
    w.position.set(0.28 * s, 0.1, 0);
    w.rotation.z = 0.45 * s;
    pivot.add(w);
    squash.add(pivot);
    wings.push(pivot);
  }

  return { root, squash, eyes, smile, mouth, wings, arms, antennae };
}

export function buildCrow(grad: DataTexture, outlineMat: MeshBasicMaterial): Group {
  const toon = (c: number) => new MeshToonMaterial({ color: new Color(c), gradientMap: grad });
  const sphere = new SphereGeometry(1, 24, 16);
  const g = new Group();
  const bodyMat = toon(0x2c2747);
  const body = new Mesh(sphere, bodyMat);
  body.scale.set(0.34, 0.3, 0.3);
  body.position.y = 0.32;
  outline(body, outlineMat, 1.08);
  const head = new Mesh(sphere, bodyMat);
  head.scale.setScalar(0.2);
  head.position.set(0, 0.68, 0.08);
  outline(head, outlineMat, 1.12);
  const beak = new Mesh(sphere, toon(0xffa53d));
  beak.scale.set(0.07, 0.05, 0.13);
  beak.position.set(0, 0.64, 0.3);
  const white = new MeshBasicMaterial({ color: 0xffffff });
  const pupil = new MeshBasicMaterial({ color: 0x14102a });
  for (const s of [-1, 1]) {
    const e = new Mesh(sphere, white);
    e.scale.setScalar(0.06);
    e.position.set(0.08 * s, 0.73, 0.22);
    const p = new Mesh(sphere, pupil);
    p.scale.setScalar(0.032);
    p.position.set(0.085 * s, 0.73, 0.27);
    g.add(e, p);
  }
  g.add(body, head, beak);
  return g;
}
