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
});
