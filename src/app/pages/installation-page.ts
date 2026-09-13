import { Component } from "@angular/core";
import { RouterLink } from "@angular/router";

import { CloneOptions } from "@/app/ui/clone-options";
import { CodeBlock } from "@/app/ui/code-block";
import { SITE } from "@/lib/site";
import { orbInstallCommand, runtimeInstallCommands } from "@/lib/snippet";

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
        <h2 class="text-xl font-semibold">1. Install dependencies and the runtime</h2>
        <p class="text-muted-foreground">
          Runtime packages, the build-time TypeGPU tooling, and the shared files every orb imports.
          <code class="bg-muted rounded px-1 py-0.5 text-sm">degit</code> downloads single files and
          folders from GitHub without cloning the repository.
        </p>
        <app-code-block [code]="installDeps" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">2. Enable the TypeGPU esbuild plugin</h2>
        <p class="text-muted-foreground">
          GPU files use
          <code class="bg-muted rounded px-1 py-0.5 text-sm">"use gpu"</code> functions that must be
          transformed at build time. Point the Angular application builder at
          <code class="bg-muted rounded px-1 py-0.5 text-sm">tools/typegpu.esbuild.ts</code>.
        </p>
        <app-code-block [code]="esbuildPlugin" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">3. Add an orb</h2>
        <p class="text-muted-foreground">
          One command per orb. The same command is on the home page and every component page, with
          that orb's slug filled in. Add a path alias for
          <code class="bg-muted rounded px-1 py-0.5 text-sm">@/*</code> pointing at
          <code class="bg-muted rounded px-1 py-0.5 text-sm">src/*</code> in your
          <code class="bg-muted rounded px-1 py-0.5 text-sm">tsconfig.json</code>.
        </p>
        <app-code-block [code]="installOrb" />
        <app-code-block [code]="pathAlias" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">4. Use it</h2>
        <app-code-block [code]="usage" />
      </section>

      <section class="space-y-3">
        <h2 class="text-xl font-semibold">5. Live audio drive (shaderng original)</h2>
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
