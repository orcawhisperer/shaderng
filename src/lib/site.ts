export const SITE = {
  name: "shaderng",
  log: "shaderng",
  tagline: "GPU shader components for Angular",
  github: "https://github.com/orcawhisperer/shaderng",
  cloneHttps: "https://github.com/orcawhisperer/shaderng.git",
  cloneSsh: "git@github.com:orcawhisperer/shaderng.git",
  url: "https://shaderng.vercel.app",
  npm: "https://www.npmjs.com/package/shaderng",
  original: "https://github.com/shadcn-labs/shadercn",
  originalName: "shadercn",
  xordev: "https://x.com/XorDev",
  vgpu: "https://vgpu.labs.vercel.dev/",
  typegpu: "https://typegpu.com/",
  angular: "https://angular.dev/",
} as const;

export const CLONE_OPTIONS = [
  {
    id: "https",
    label: "HTTPS",
    command: `git clone ${SITE.cloneHttps}`,
  },
  {
    id: "ssh",
    label: "SSH",
    command: `git clone ${SITE.cloneSsh}`,
  },
  {
    id: "url",
    label: "URL",
    command: SITE.cloneHttps,
  },
] as const;

export type CloneOptionId = (typeof CLONE_OPTIONS)[number]["id"];
