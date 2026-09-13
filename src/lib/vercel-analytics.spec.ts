import { analyticsPageview, isVercelHost } from "./vercel-analytics";

describe("isVercelHost", () => {
  it("accepts the production host and Vercel previews", () => {
    expect(isVercelHost("shaderng.vercel.app")).toBe(true);
    expect(isVercelHost("shaderng-git-feature-x.vercel.app")).toBe(true);
  });

  it("rejects GitHub Pages and local hosts", () => {
    expect(isVercelHost("orcawhisperer.github.io")).toBe(false);
    expect(isVercelHost("localhost")).toBe(false);
  });
});

describe("analyticsPageview", () => {
  it("strips query and hash from the path", () => {
    expect(analyticsPageview("/docs/installation?ref=home#setup", {})).toEqual({
      path: "/docs/installation",
      route: "/docs/installation",
    });
  });

  it("replaces dynamic segments with the route pattern", () => {
    expect(analyticsPageview("/docs/components/orb-01", { slug: "orb-01" })).toEqual({
      path: "/docs/components/orb-01",
      route: "/docs/components/[slug]",
    });
  });
});
