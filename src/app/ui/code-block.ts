import { Component, input } from "@angular/core";

import { CopyButton } from "@/app/ui/copy-button";

@Component({
  selector: "app-code-block",
  imports: [CopyButton],
  template: `
    <div class="bg-code relative overflow-hidden rounded-lg">
      <pre class="overflow-x-auto p-4 pr-12 font-mono text-sm"><code>{{ code() }}</code></pre>
      <app-copy-button
        className="absolute top-2 right-2 size-7 px-0"
        label="Copy code"
        [value]="code()"
      >
        <svg class="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      </app-copy-button>
    </div>
  `,
})
export class CodeBlock {
  readonly code = input.required<string>();
}
