// Particle pool (sparkles, fireworks). Copied from ../bridge-wait/scene.ts, where the class is not exported on
// this branch; the Star Path branch exports it from there. TODO: extract to ../shared once both branches merge.
import { AdditiveBlending, BufferGeometry, type Color, Float32BufferAttribute, Points, PointsMaterial, type Texture, type Vector3 } from "three";

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
