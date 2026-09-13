import { CLONE_OPTIONS, SITE } from "./site";

describe("SITE", () => {
  it("points GitHub at the shaderng repo", () => {
    expect(SITE.github).toBe("https://github.com/orcawhisperer/shaderng");
    expect(SITE.cloneHttps).toBe("https://github.com/orcawhisperer/shaderng.git");
    expect(SITE.cloneSsh).toBe("git@github.com:orcawhisperer/shaderng.git");
  });

  it("exposes copyable clone commands", () => {
    expect(CLONE_OPTIONS.map((option) => option.id)).toEqual(["https", "ssh", "url"]);
    expect(CLONE_OPTIONS[0].command).toBe(
      "git clone https://github.com/orcawhisperer/shaderng.git",
    );
    expect(CLONE_OPTIONS[1].command).toBe("git clone git@github.com:orcawhisperer/shaderng.git");
    expect(CLONE_OPTIONS[2].command).toBe(SITE.cloneHttps);
  });
});
