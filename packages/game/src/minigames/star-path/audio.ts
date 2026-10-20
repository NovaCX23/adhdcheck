// Star notes, synthesised with Web Audio (no file). The pitch follows the position in the sequence, never the
// star: the same star sounds different in different sequences, so a melody cannot stand in for where the stars
// were (the task stays visuospatial, research/04 section 5). The AudioContext is created and resumed only
// inside a user gesture (iOS Safari rule), via unlock(). Without audio every method is a silent no-op.

// C major pentatonic from C5 upward: calm, no wrong-sounding note whatever the order.
const NOTES = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.51, 1567.98];

export class StarTones {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private closed = false;

  unlock(): void {
    if (this.closed) return;
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.8;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
    } catch {
      this.ctx = null;
    }
  }

  /** A soft bell for the star at position `pos` of the sequence. */
  note(pos: number): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running" || !this.master) return;
    const f = NOTES[Math.min(pos, NOTES.length - 1)] as number;
    const now = ctx.currentTime;
    for (const [mult, peak, decay] of [
      [1, 0.2, 0.8],
      [2, 0.06, 0.45],
    ] as const) {
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + decay);
      g.connect(this.master);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f * mult;
      o.connect(g);
      o.start(now);
      o.stop(now + decay + 0.05);
    }
  }

  close(): void {
    this.closed = true;
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
