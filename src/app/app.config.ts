import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { provideRouter, Router, TitleStrategy, withInMemoryScrolling } from "@angular/router";

import { PageTitleStrategy } from "@/lib/page-title";
import { installVercelAnalytics } from "@/lib/vercel-analytics";
import { routes } from "./app.routes";

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: TitleStrategy, useClass: PageTitleStrategy },
    // Subscribe before the router’s initial navigation so the first pageview is not missed.
    provideAppInitializer(() => installVercelAnalytics(inject(Router))),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: "enabled",
        scrollPositionRestoration: "enabled",
      }),
    ),
  ],
};
