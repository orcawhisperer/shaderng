import { Component, computed, signal } from "@angular/core";

import { CodeBlock } from "@/app/ui/code-block";
import { CLONE_OPTIONS, type CloneOptionId } from "@/lib/site";

@Component({
  selector: "app-clone-options",
  imports: [CodeBlock],
  template: `
    <div class="space-y-3 text-left">
      <div class="flex flex-wrap gap-1">
        @for (option of options; track option.id) {
          <button
            type="button"
            class="inline-flex h-8 items-center rounded-md border px-3 text-sm transition-colors"
            [class]="
              option.id === selected()
                ? 'bg-secondary text-secondary-foreground'
                : 'hover:bg-muted bg-background text-muted-foreground'
            "
            (click)="selected.set(option.id)"
          >
            {{ option.label }}
          </button>
        }
      </div>
      <app-code-block [code]="command()" />
    </div>
  `,
})
export class CloneOptions {
  protected readonly options = CLONE_OPTIONS;
  protected readonly selected = signal<CloneOptionId>("https");
  protected readonly command = computed(() => {
    const id = this.selected();
    return this.options.find((option) => option.id === id)?.command ?? "";
  });
}
