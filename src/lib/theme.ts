import { DestroyRef, inject, Injectable, signal } from "@angular/core";

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";
const LIGHT_QUERY = "(prefers-color-scheme: light)";

const readStored = (): Theme | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "light" || stored === "dark" ? stored : null;
  } catch {
    return null;
  }
};

/**
 * Dark by default (the shaders are designed against it), light when the visitor
 * asked for it: an explicit choice wins, then the OS `prefers-color-scheme`. A
 * visitor who never toggled keeps following the OS when it changes.
 */
@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly theme = signal<Theme>("dark");
  private explicit = readStored() !== null;

  constructor() {
    const media = typeof matchMedia === "function" ? matchMedia(LIGHT_QUERY) : undefined;
    this.apply(readStored() ?? (media?.matches ? "light" : "dark"));

    if (media) {
      const follow = (event: MediaQueryListEvent) => {
        if (!this.explicit) {
          this.apply(event.matches ? "light" : "dark");
        }
      };
      media.addEventListener("change", follow);
      inject(DestroyRef).onDestroy(() => media.removeEventListener("change", follow));
    }
  }

  toggle() {
    this.set(this.theme() === "dark" ? "light" : "dark");
  }

  set(theme: Theme) {
    this.explicit = true;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Private mode or storage quota: the choice still applies for this page view.
    }
    this.apply(theme);
  }

  private apply(theme: Theme) {
    this.theme.set(theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme === "dark" ? "#09090b" : "#ffffff");
  }
}
