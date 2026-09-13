import { Injectable, signal } from "@angular/core";

export type Theme = "light" | "dark";

@Injectable({ providedIn: "root" })
export class ThemeService {
  readonly theme = signal<Theme>("dark");

  constructor() {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
    const next: Theme =
      stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light";
    this.set(next);
  }

  toggle() {
    this.set(this.theme() === "dark" ? "light" : "dark");
  }

  set(theme: Theme) {
    this.theme.set(theme);
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
    const meta = document.querySelector('meta[name="theme-color"]');
    meta?.setAttribute("content", theme === "dark" ? "#09090b" : "#ffffff");
  }
}
