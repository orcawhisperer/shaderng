import { Component, computed, inject } from "@angular/core";
import { NavigationEnd, Router, RouterOutlet } from "@angular/router";
import { toSignal } from "@angular/core/rxjs-interop";
import { filter, map, startWith } from "rxjs";

import { SiteFooter } from "@/app/layout/site-footer";
import { SiteHeader } from "@/app/layout/site-header";

@Component({
  selector: "app-root",
  imports: [RouterOutlet, SiteHeader, SiteFooter],
  templateUrl: "./app.html",
})
export class App {
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event): event is NavigationEnd => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  protected readonly hideFooter = computed(() => this.url().startsWith("/playground"));
}
