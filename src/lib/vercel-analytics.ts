import { isDevMode } from "@angular/core";
import { ActivatedRouteSnapshot, NavigationEnd, Router } from "@angular/router";
import { computeRoute, inject as injectAnalytics, pageview } from "@vercel/analytics";
import { filter } from "rxjs";

/**
 * shaderng is Angular, not Next.js — `@vercel/analytics/next` cannot be used here.
 * inject() has no Angular router support, so auto pageviews are disabled and each
 * NavigationEnd is sent with the parameterized route (e.g. /docs/components/[slug]).
 */
export function installVercelAnalytics(router: Router): void {
  injectAnalytics({
    framework: "angular",
    disableAutoTrack: true,
    mode: isDevMode() ? "development" : "production",
  });

  router.events
    .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
    .subscribe((event) => {
      pageview(analyticsPageview(event.urlAfterRedirects, routeParams(router)));
    });
}

export function analyticsPageview(
  urlAfterRedirects: string,
  params: Record<string, string>,
): { path: string; route: string | null } {
  const path = urlAfterRedirects.split(/[?#]/, 1)[0] || "/";
  return {
    path,
    route: computeRoute(path, Object.keys(params).length ? params : null),
  };
}

export function routeParams(router: Router): Record<string, string> {
  const params: Record<string, string> = {};
  let snapshot: ActivatedRouteSnapshot | null = router.routerState.snapshot.root;
  while (snapshot) {
    for (const [key, value] of Object.entries(snapshot.params)) {
      if (typeof value === "string") {
        params[key] = value;
      }
    }
    snapshot = snapshot.firstChild;
  }
  return params;
}
