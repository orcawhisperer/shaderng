import { FIELD_CATALOG, FIELD_SLUGS, isFieldSlug } from "./field-catalog";
import { loadField } from "./field-loaders";
import { ORB_CATALOG, ORB_SLUGS, isOrbSlug } from "./orb-catalog";
import { loadOrb } from "./orb-loaders";
import {
  buildAngularSnippet,
  fieldInstallCommand,
  ngAddCommand,
  ngGenerateFieldCommand,
  ngGenerateOrbCommand,
  ngPresetCommand,
  ngUpdateCommand,
  orbInstallCommand,
  RUNTIME_PATHS,
  runtimeInstallCommands,
  type SnippetDraft,
} from "./snippet";
import { cn } from "./utils";

describe("orb catalog", () => {
  it("ships 33 orbs", () => {
    expect(ORB_SLUGS).toHaveLength(33);
    expect(ORB_CATALOG).toHaveLength(33);
  });

  it("keeps sequential slugs", () => {
    expect(ORB_SLUGS[0]).toBe("orb-01");
    expect(ORB_SLUGS[32]).toBe("orb-33");
  });

  it("describes every orb", () => {
    const blank = ORB_CATALOG.filter((item) => !item.description.trim());
    expect(blank.map((item) => item.slug)).toEqual([]);
  });

  it("narrows slugs", () => {
    expect(isOrbSlug("orb-07")).toBe(true);
    expect(isOrbSlug("orb-99")).toBe(false);
    expect(isOrbSlug(undefined)).toBe(false);
  });

  it("rejects unknown orbs instead of falling back", async () => {
    await expect(loadOrb("orb-99")).rejects.toThrow('Unknown orb "orb-99"');
  });
});

describe("field catalog", () => {
  it("ships five original fields", () => {
    expect(FIELD_SLUGS).toEqual(["aurora", "flow", "grid", "waves", "caustics"]);
    expect(FIELD_CATALOG).toHaveLength(5);
  });

  it("describes every field", () => {
    const blank = FIELD_CATALOG.filter((item) => !item.description.trim());
    expect(blank.map((item) => item.slug)).toEqual([]);
  });

  it("narrows slugs", () => {
    expect(isFieldSlug("aurora")).toBe(true);
    expect(isFieldSlug("orb-01")).toBe(false);
    expect(isFieldSlug(undefined)).toBe(false);
  });

  it("rejects unknown fields instead of falling back", async () => {
    await expect(loadField("nebula")).rejects.toThrow('Unknown field "nebula"');
  });
});

describe("cn", () => {
  it("merges tailwind classes", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });
});

describe("buildAngularSnippet", () => {
  const variant = {
    colors: [{ default: "#ffffff", key: "tint", label: "Tint" }],
    key: "orb-01",
    label: "ORB-01",
    note: "test",
    params: [{ default: 0.5, key: "speed", label: "Speed", max: 10, min: 0, step: 0.1 }],
  };

  const draft: SnippetDraft = {
    autoDrive: true,
    colors: { tint: "#ffffff" },
    input: 0,
    output: 0.3,
    params: { speed: 0.5 },
  };

  it("emits an Angular component snippet", () => {
    const snippet = buildAngularSnippet({
      draft,
      size: 280,
      slug: "orb-01",
      state: "idle",
      variant,
    });
    expect(snippet).toContain("import { Orb01 }");
    expect(snippet).toContain("<orb-01");
    expect(snippet).toContain('state="idle"');
  });

  it("includes param overrides", () => {
    const snippet = buildAngularSnippet({
      draft: { ...draft, params: { speed: 1.25 } },
      size: 420,
      slug: "orb-01",
      state: "idle",
      variant,
    });
    expect(snippet).toContain('[params]="{ speed: 1.25 }"');
  });

  it("includes listen when enabled", () => {
    const snippet = buildAngularSnippet({
      draft,
      listen: true,
      size: 280,
      slug: "orb-01",
      state: "speaking",
      variant,
    });
    expect(snippet).toContain('[listen]="true"');
    expect(snippet).not.toContain("[volumes]");
  });
});

describe("install commands", () => {
  it("fetches one orb folder from the GitHub repo with degit", () => {
    expect(orbInstallCommand("orb-07")).toBe(
      "npx degit orcawhisperer/shaderng/src/components/orbs/orb-07 src/components/orbs/orb-07",
    );
  });

  it("lists every runtime file the orbs import", () => {
    const commands = runtimeInstallCommands();
    expect(commands.startsWith("npm i vgpu typegpu clsx tailwind-merge\n")).toBe(true);
    expect(commands).toContain("npm i -D @angular-builders/custom-esbuild unplugin-typegpu");
    for (const path of RUNTIME_PATHS) {
      expect(commands).toContain(`npx degit orcawhisperer/shaderng/${path} ${path}`);
    }
    expect(RUNTIME_PATHS).toContain("src/webgpu.d.ts");
    expect(RUNTIME_PATHS).toContain("tools/typegpu.esbuild.ts");
  });

  it("names the ng add package and its orb schematic", () => {
    expect(ngAddCommand()).toBe("ng add shaderng");
    expect(ngGenerateOrbCommand("orb-07")).toBe("ng g shaderng:orb orb-07");
    expect(ngPresetCommand("orb-07", "https://x/playground?orb=orb-07&state=idle")).toBe(
      'ng g shaderng:orb orb-07 --preset "https://x/playground?orb=orb-07&state=idle" --name look',
    );
    expect(ngPresetCommand("orb-07", "?p=a:1", "hero")).toContain("--name hero");
    expect(ngUpdateCommand()).toBe("ng update shaderng");
    expect(ngGenerateFieldCommand("aurora")).toBe("ng g shaderng:field aurora");
    expect(fieldInstallCommand("aurora")).toBe(
      "npx degit orcawhisperer/shaderng/src/components/fields/aurora src/components/fields/aurora",
    );
  });
});
