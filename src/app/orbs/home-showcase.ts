import { Component, computed, signal } from "@angular/core";

import { OrbPreview } from "@/app/orbs/orb-preview";
import { CopyButton } from "@/app/ui/copy-button";
import { ORB_CATALOG } from "@/lib/orb-catalog";
import { orbInstallCommand } from "@/lib/snippet";
import { cn } from "@/lib/utils";

@Component({
  selector: "app-home-showcase",
  imports: [OrbPreview, CopyButton],
  template: `
    <div [class]="cn('bg-card overflow-hidden rounded-xl border text-left shadow-sm', className)">
      <div class="border-b sm:grid sm:grid-cols-[16rem_1fr] sm:items-stretch">
        <div class="flex items-center justify-between gap-3 px-4 py-3 sm:hidden">
          <span class="text-sm font-medium">Choose orb</span>
          <select
            class="bg-background h-8 w-[180px] rounded-md border px-2 text-sm"
            [value]="slug()"
            (change)="slug.set($any($event.target).value)"
          >
            @for (item of filtered(); track item.slug) {
              <option [value]="item.slug">{{ item.title }}</option>
            }
          </select>
        </div>
        <div class="hidden items-center px-4 py-3 sm:flex sm:border-r">
          <span class="text-sm font-semibold">Components</span>
        </div>
        <div class="hidden items-center justify-end px-4 py-3 sm:flex">
          <app-copy-button label="Copy install command" [value]="installCommand()">
            <span class="max-w-[28rem] truncate font-mono text-xs">{{ installCommand() }}</span>
          </app-copy-button>
        </div>
      </div>

      <div class="border-b px-4 py-3 sm:hidden">
        <app-copy-button
          className="w-full justify-start"
          label="Copy install command"
          [value]="installCommand()"
        >
          <span class="min-w-0 truncate font-mono text-xs">{{ installCommand() }}</span>
        </app-copy-button>
      </div>

      <div class="grid sm:grid-cols-[16rem_1fr]">
        <aside class="hidden h-[60vh] flex-col border-b sm:flex sm:border-r sm:border-b-0">
          <div class="p-2.5">
            <input
              class="bg-background h-9 w-full rounded-md border px-3 text-sm"
              placeholder="Search orbs…"
              [value]="query()"
              (input)="query.set($any($event.target).value)"
            />
          </div>
          <nav class="no-scrollbar flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2.5">
            @for (item of filtered(); track item.slug) {
              <button
                type="button"
                class="flex flex-col items-start gap-0.5 rounded-md px-2 py-1.5 text-left transition-colors"
                [class]="
                  item.slug === slug() ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/60'
                "
                (click)="slug.set(item.slug)"
              >
                <span class="text-sm font-medium">{{ item.title }}</span>
                <span class="text-muted-foreground line-clamp-1 text-xs">{{
                  item.description
                }}</span>
              </button>
            } @empty {
              <p class="text-muted-foreground px-2 py-6 text-center text-sm">No orbs found.</p>
            }
          </nav>
        </aside>

        <div class="h-[60vh] overflow-hidden">
          <app-orb-preview className="h-full min-h-0 rounded-none border-0 p-0" [slug]="slug()" />
        </div>
      </div>
    </div>
  `,
})
export class HomeShowcase {
  readonly className = "";
  protected readonly cn = cn;
  protected readonly slug = signal(ORB_CATALOG[0].slug);
  protected readonly query = signal("");
  protected readonly filtered = computed(() => {
    const term = this.query().trim().toLowerCase();
    if (!term) {
      return ORB_CATALOG;
    }
    return ORB_CATALOG.filter(
      (item) =>
        item.title.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term),
    );
  });

  protected readonly installCommand = computed(() => orbInstallCommand(this.slug()));
}
