import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";

import { OrbPlayground } from "@/app/orbs/orb-playground";
import { ORB_STATES, type OrbState } from "@/components/orbs/renderer";
import { ORB_SLUGS, isOrbSlug } from "@/lib/orb-catalog";

@Component({
  selector: "app-playground-page",
  imports: [OrbPlayground],
  template: `
    <div class="container-wrapper px-6">
      <div class="h-[calc(100svh-var(--header-height))] pb-4">
        <app-orb-playground [initialSlug]="slug()" [initialState]="state()" />
      </div>
    </div>
  `,
})
export class PlaygroundPage {
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly slug = computed(() => {
    const orb = this.query()?.get("orb");
    return isOrbSlug(orb) ? orb : ORB_SLUGS[0];
  });

  protected readonly state = computed(
    () => ORB_STATES.find((value) => value === this.query()?.get("state")) ?? ("idle" as OrbState),
  );
}
