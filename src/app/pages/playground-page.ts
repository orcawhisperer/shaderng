import { Component, inject } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { OrbPlayground } from "@/app/orbs/orb-playground";
import { ORB_SLUGS, ORB_STATE_VALUES } from "@/lib/orb-catalog";
import type { OrbState } from "@/components/orbs/renderer";

@Component({
  selector: "app-playground-page",
  imports: [OrbPlayground],
  template: `
    <div class="container-wrapper px-6">
      <div class="h-[calc(100svh-var(--header-height))] pb-4">
        <app-orb-playground [initialSlug]="slug" [initialState]="state" />
      </div>
    </div>
  `,
})
export class PlaygroundPage {
  private readonly route = inject(ActivatedRoute);

  protected readonly slug =
    ORB_SLUGS.find((value) => value === this.route.snapshot.queryParamMap.get("orb")) ??
    ORB_SLUGS[0];

  protected readonly state: OrbState =
    ORB_STATE_VALUES.find((value) => value === this.route.snapshot.queryParamMap.get("state")) ??
    "idle";
}
