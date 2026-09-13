import { Routes } from "@angular/router";

export const routes: Routes = [
  {
    path: "",
    loadComponent: () => import("./pages/home-page").then((m) => m.HomePage),
  },
  {
    path: "playground",
    loadComponent: () => import("./pages/playground-page").then((m) => m.PlaygroundPage),
  },
  {
    path: "docs",
    loadComponent: () => import("./layout/docs-layout").then((m) => m.DocsLayout),
    children: [
      {
        path: "",
        loadComponent: () => import("./pages/docs-page").then((m) => m.DocsPage),
      },
      {
        path: "installation",
        loadComponent: () =>
          import("./pages/installation-page").then((m) => m.InstallationPage),
      },
      {
        path: "changelog",
        loadComponent: () => import("./pages/changelog-page").then((m) => m.ChangelogPage),
      },
      {
        path: "credits",
        loadComponent: () => import("./pages/credits-page").then((m) => m.CreditsPage),
      },
      {
        path: "components",
        loadComponent: () =>
          import("./pages/components-page").then((m) => m.ComponentsPage),
      },
      {
        path: "components/:slug",
        loadComponent: () => import("./pages/orb-docs-page").then((m) => m.OrbDocsPage),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
