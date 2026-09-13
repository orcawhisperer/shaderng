import { Injectable, inject } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { RouterStateSnapshot, TitleStrategy } from "@angular/router";

import { SITE } from "@/lib/site";

export const formatPageTitle = (routeTitle: string | undefined): string =>
  routeTitle ? `${routeTitle} · ${SITE.name}` : `${SITE.name} — ${SITE.tagline}`;

/** `Installation · shaderng` on inner pages; the tagline on home and unknown routes. */
@Injectable({ providedIn: "root" })
export class PageTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    this.title.setTitle(formatPageTitle(this.buildTitle(snapshot)));
  }
}
