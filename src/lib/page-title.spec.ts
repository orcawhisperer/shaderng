import { formatPageTitle } from "./page-title";

describe("formatPageTitle", () => {
  it("suffixes inner pages with the site name", () => {
    expect(formatPageTitle("Installation")).toBe("Installation · shaderng");
    expect(formatPageTitle("ORB-07 Helix")).toBe("ORB-07 Helix · shaderng");
  });

  it("falls back to the tagline for home and untitled routes", () => {
    expect(formatPageTitle("")).toBe("shaderng — GPU shader components for Angular");
    expect(formatPageTitle(undefined)).toBe("shaderng — GPU shader components for Angular");
  });
});
