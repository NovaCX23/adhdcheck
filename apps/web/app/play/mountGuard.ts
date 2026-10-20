// Shared by the four 3D game canvases: a failed mount (for example no WebGL) leaves a calm message
// instead of a blank screen, and never an unhandled rejection. The sentence is passed in by the caller.
export interface MountTarget {
  textContent: string | null;
  className: string;
  replaceChildren(): void;
}

/** Returns a cancel function for the effect cleanup; it destroys a handle that arrives after cancel. */
export function mountWithFallback<H extends { destroy(): void }>(
  el: MountTarget,
  mounting: Promise<H>,
  fallbackText: string,
  onHandle: (h: H) => void,
): () => void {
  let cancelled = false;
  mounting.then(
    (h) => {
      if (cancelled) h.destroy();
      else onHandle(h);
    },
    () => {
      if (cancelled) return;
      el.replaceChildren();
      el.className = `${el.className} flex items-center justify-center p-6 text-center`;
      el.textContent = fallbackText;
    },
  );
  return () => {
    cancelled = true;
  };
}
