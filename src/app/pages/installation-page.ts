import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { CloneOptions } from "@/app/ui/clone-options";
import { CodeBlock } from "@/app/ui/code-block";
import { SITE } from "@/lib/site";
import {
  ngAddCommand,
  ngGenerateOrbCommand,
  orbInstallCommand,
  runtimeInstallCommands,
} from "@/lib/snippet";

@Component({
  selector: "app-installation-page",
  imports: [CloneOptions, CodeBlock, RouterLink],
  template: `
    <article class="mx-auto max-w-3xl space-y-8">
      <p class="text-muted-foreground text-sm">Docs</p>
      <h1 class="text-3xl font-semibold tracking-tight">Installation</h1>
      <p class="text-muted-foreground text-lg">
        Add GPU shader components to an Angular 22 app. Components use
        <a class="text-foreground underline underline-offset-4" href="https://vgpu.labs.vercel.dev/"
          >vgpu</a
        >
        as the shader runtime and
        <a class="text-foreground underline underline-offset-4" href="https://typegpu.com/"
          >TypeGPU</a
        >
        for type-safe GPU code.
      </p>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Clone</h2>
        <p class="text-muted-foreground">
          Source lives at
          <a
            class="text-foreground underline underline-offset-4"
            [href]="site.github"
            rel="noreferrer"
            target="_blank"
            >{{ site.github }}</a
          >. Copy HTTPS, SSH, or the raw git URL.
        </p>
        <app-clone-options />
      </section>

      <section class="border-border bg-muted/40 space-y-2 rounded-xl border p-4 text-sm">
        <p class="font-medium">Before you copy anything: two licenses.</p>
        <p class="text-muted-foreground">
          The runtime, presets, and Angular wrappers are MIT. Every
          <code class="bg-muted rounded px-1 py-0.5">gpu.ts</code> is XorDev’s shader, ported with
          permission, and is
          <strong class="text-foreground">non-commercial use only, with attribution</strong>. Keep
          the header notice in the file. Commercial use of the shader programs needs XorDev’s
          permission. Details on the
          <a class="text-foreground underline underline-offset-4" routerLink="/docs/credits"
            >credits page</a
          >.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Prerequisites</h2>
        <ul class="text-muted-foreground list-disc space-y-1 pl-5">
          <li>Angular 22 with the application builder (esbuild)</li>
          <li>A Chromium browser with WebGPU (Chrome / Edge 113+)</li>
          <li>Node.js 22.22.3 or later</li>
        </ul>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">1. ng add</h2>
        <p class="text-muted-foreground">
          One command installs the runtime packages and the build-time TypeGPU tooling, copies the
          shared runtime into <code class="bg-muted rounded px-1 py-0.5 text-sm">src/</code>,
          switches the project to the custom esbuild builder with the plugin registered, adds the
          <code class="bg-muted rounded px-1 py-0.5 text-sm">@/*</code> path alias, and copies the
          orbs you pick (<code class="bg-muted rounded px-1 py-0.5 text-sm">orb-01</code> by
          default).
        </p>
        <app-code-block [code]="ngAdd" />
        <p class="text-muted-foreground text-sm">
          Files that already exist are left alone; pass
          <code class="bg-muted rounded px-1 py-0.5">--force</code> to overwrite them. The schematic
          refuses the webpack <code class="bg-muted rounded px-1 py-0.5">browser</code> builder,
          since the TypeGPU transform only runs under esbuild.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">2. Add orbs</h2>
        <p class="text-muted-foreground">
          Every component page shows this line with its own slug. Slugs, bare numbers, and
          <code class="bg-muted rounded px-1 py-0.5 text-sm">all</code> are accepted.
        </p>
        <app-code-block [code]="generateOrb" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">3. Use it</h2>
        <app-code-block [code]="usage" />
        <p class="text-muted-foreground text-sm">
          The WebGPU runtime adds roughly 500 kB to the initial bundle, above the 500 kB warning
          budget a new project starts with (well under the 1 MB error). Raise the
          <code class="bg-muted rounded px-1 py-0.5">initial</code> budget in
          <code class="bg-muted rounded px-1 py-0.5">angular.json</code>, or load the orb behind a
          dynamic <code class="bg-muted rounded px-1 py-0.5">import()</code> so it leaves the
          initial chunk.
        </p>
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Without ng add</h2>
        <p class="text-muted-foreground">
          The same result by hand, for projects that cannot run schematics.
          <code class="bg-muted rounded px-1 py-0.5 text-sm">degit</code> downloads single files and
          folders from GitHub without cloning the repository. Install the packages and fetch the
          runtime files:
        </p>
        <app-code-block [code]="installDeps" />
        <p class="text-muted-foreground">
          GPU files use
          <code class="bg-muted rounded px-1 py-0.5 text-sm">"use gpu"</code> functions that must be
          transformed at build time. Point the Angular application builder at
          <code class="bg-muted rounded px-1 py-0.5 text-sm">tools/typegpu.esbuild.ts</code>:
        </p>
        <app-code-block [code]="esbuildPlugin" />
        <p class="text-muted-foreground">
          Add a path alias for
          <code class="bg-muted rounded px-1 py-0.5 text-sm">@/*</code> pointing at
          <code class="bg-muted rounded px-1 py-0.5 text-sm">src/*</code> in
          <code class="bg-muted rounded px-1 py-0.5 text-sm">tsconfig.json</code>, then fetch one
          folder per orb:
        </p>
        <app-code-block [code]="pathAlias" />
        <app-code-block [code]="installOrb" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">Live audio drive (shaderng original)</h2>
        <p class="text-muted-foreground">
          shadercn feeds voice levels as
          <code class="bg-muted rounded px-1 py-0.5 text-sm">volumes</code>. shaderng measures them
          for you from any audio source through
          <code class="bg-muted rounded px-1 py-0.5 text-sm">[audio]</code>: the microphone, a
          WebRTC or TTS <code class="bg-muted rounded px-1 py-0.5 text-sm">MediaStream</code>, a Web
          Audio node, or an
          <code class="bg-muted rounded px-1 py-0.5 text-sm">&lt;audio&gt;</code> element.
          <code class="bg-muted rounded px-1 py-0.5 text-sm">[listen]="true"</code> is shorthand for
          the microphone.
        </p>
        <app-code-block [code]="listenSnippet" />
        <p class="text-muted-foreground text-sm">
          Streams and nodes you pass in are left running when the orb unmounts; only a microphone
          the orb opened itself is stopped. Media elements use
          <code class="bg-muted rounded px-1 py-0.5">captureStream()</code> where available so
          playback is untouched.
        </p>
      </section>
    </article>
  `,
})
export class InstallationPage {
  protected readonly site = SITE;
  protected readonly ngAdd = `${ngAddCommand()}
${ngAddCommand()} --orbs orb-01,orb-07   # pick orbs
${ngAddCommand()} --orbs all             # all 33
${ngAddCommand()} --orbs ""              # runtime only`;
  protected readonly generateOrb = `${ngGenerateOrbCommand("orb-07")}
${ngGenerateOrbCommand("12,13,14")}
${ngGenerateOrbCommand("--list")}`;
  protected readonly installDeps = runtimeInstallCommands();
  protected readonly installOrb = orbInstallCommand("orb-01");
  protected readonly pathAlias = `"compilerOptions": {
  "baseUrl": ".",
  "paths": { "@/*": ["src/*"] }
}`;
  protected readonly esbuildPlugin = `"builder": "@angular-builders/custom-esbuild:application",
"options": {
  "plugins": ["tools/typegpu.esbuild.ts"]
}`;
  protected readonly usage = `import { Orb01 } from "@/components/orbs/orb-01";

@Component({
  imports: [Orb01],
  template: \`<orb-01 [size]="280" state="idle" />\`,
})
export class Hero {}`;
  protected readonly listenSnippet = `<!-- microphone -->
<orb-01 state="speaking" [listen]="true" />

<!-- the assistant's voice: a WebRTC remote stream or TTS output -->
<orb-01 state="speaking" [audio]="remoteStream" />

<!-- an <audio> element -->
<audio #player src="/reply.mp3" autoplay></audio>
<orb-01 state="speaking" [audio]="player" />

<!-- a node in your own Web Audio graph -->
<orb-01 state="speaking" [audio]="gainNode" />`;
}
