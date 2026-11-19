/**
 * Runs non-critical client work once the visitor engages with the page.
 *
 * Analytics (Firestore writes) used to start during hydration, which kept a
 * ~85 kB Firestore chunk on the critical path of every page. Waiting for the
 * first interaction — with a generous fallback for passive readers — keeps
 * that work off the load path while still recording real sessions.
 */
export function whenIdleOrInteraction(
  task: () => void,
  fallbackMs = 12000
): () => void {
  let done = false;
  let idleId: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const cleanup = () => {
    window.removeEventListener("pointerdown", run, true);
    window.removeEventListener("keydown", run, true);
    window.removeEventListener("scroll", run, true);
    window.removeEventListener("touchstart", run, true);
    if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
    if (timer !== undefined) clearTimeout(timer);
  };

  const run = () => {
    if (done) return;
    done = true;
    cleanup();
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(() => task(), { timeout: 2000 });
    } else {
      timer = setTimeout(task, 200);
    }
  };

  window.addEventListener("pointerdown", run, { capture: true, once: true });
  window.addEventListener("keydown", run, { capture: true, once: true });
  window.addEventListener("scroll", run, { capture: true, once: true, passive: true });
  window.addEventListener("touchstart", run, { capture: true, once: true, passive: true });
  timer = setTimeout(run, fallbackMs);

  return () => {
    done = true;
    cleanup();
  };
}
