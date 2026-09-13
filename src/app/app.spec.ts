import { provideRouter } from "@angular/router";
import { TestBed } from "@angular/core/testing";

import { App } from "./app";

describe("App", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("should render the product name", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain("shaderng");
  });

  it("should render the orb logo instead of the ng badge", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector("app-logo-mark")).toBeTruthy();
    const ngBadge = Array.from(compiled.querySelectorAll("header span")).find(
      (el) => el.textContent?.trim() === "ng",
    );
    expect(ngBadge).toBeUndefined();
  });

  it("should link Source to the Origin repo, not GitHub", async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const source = Array.from(compiled.querySelectorAll("header a")).find(
      (el) => el.textContent?.trim() === "Source",
    ) as HTMLAnchorElement | undefined;
    expect(source).toBeTruthy();
    expect(source?.getAttribute("href")).toContain("cursor.com/codebase/");
    expect(compiled.querySelector("header")?.textContent).not.toContain("GitHub");
  });
});
