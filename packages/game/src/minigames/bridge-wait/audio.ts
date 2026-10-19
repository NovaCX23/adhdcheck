// Chime from the Web Audio API, no audio file. The AudioContext is created and resumed only inside a
// user gesture (iOS Safari rule), via unlock(), which the scene calls from the first pointerdown.
// The game works muted: the visual cue (bridge lights up) is always drawn.
export class Chime {
  private ctx: AudioContext | null = null;

  /** Call from inside a pointerdown handler. Safe to call repeatedly. */
  unlock(): void {
    try {
      if (!this.ctx) {
        const Ctor =
          window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
      }
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => undefined);
    } catch {
      this.ctx = null; // audio unavailable: the game still works with the visual cue
    }
  }

  play(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== "running") return;
    const now = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
    gain.connect(ctx.destination);
    for (const f of [880, 1320]) {
      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = f;
      osc.connect(gain);
      osc.start(now);
      osc.stop(now + 0.65);
    }
  }

  close(): void {
    void this.ctx?.close().catch(() => undefined);
    this.ctx = null;
  }
}
