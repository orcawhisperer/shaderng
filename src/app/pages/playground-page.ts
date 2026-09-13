import { Component, computed, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute } from "@angular/router";

import { OrbPlayground } from "@/app/orbs/orb-playground";
import { ORB_SLUGS } from "@/lib/orb-catalog";
import { decodeShare } from "@/lib/playground-url";

@Component({
  selector: "app-playground-page",
  imports: [OrbPlayground],
  template: `
    <div class="container-wrapper px-6">
      <div class="h-[calc(100svh-var(--header-height))] pb-4">
        <app-orb-playground
          [initialSlug]="share().orb ?? fallbackSlug"
          [initialState]="share().state ?? 'idle'"
          [initialShare]="share()"
        />
      </div>
    </div>
  `,
})
export class PlaygroundPage {
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly fallbackSlug = ORB_SLUGS[0];
  protected readonly share = computed(() => decodeShare((key) => this.query()?.get(key) ?? null));
}
