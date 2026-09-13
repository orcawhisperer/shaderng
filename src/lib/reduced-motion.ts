import { DestroyRef, inject, signal, type Signal } from "@angular/core";

const QUERY = "(prefers-reduced-motion: reduce)";

/**
 * Live `prefers-reduced-motion` as a signal. Must be called in an injection
 * context; the media-query listener is removed when that context is destroyed.
 * Returns a constant `false` where `matchMedia` does not exist (SSR, tests).
 */
export function prefersReducedMotion(): Signal<boolean> {
  const media = typeof window !== "undefined" ? window.matchMedia?.(QUERY) : undefined;
  const reduced = signal(Boolean(media?.matches));
  if (!media) {
    return reduced.asReadonly();
  }
  const onChange = (event: MediaQueryListEvent) => reduced.set(event.matches);
  media.addEventListener("change", onChange);
  inject(DestroyRef).onDestroy(() => media.removeEventListener("change", onChange));
  return reduced.asReadonly();
}
