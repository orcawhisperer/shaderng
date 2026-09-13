import { analyticsPageview } from "./vercel-analytics";

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
