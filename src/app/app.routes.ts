import { ActivatedRouteSnapshot, Routes } from "@angular/router";

import { FIELD_CATALOG_MAP, isFieldSlug } from "@/lib/field-catalog";
import { ORB_CATALOG_MAP, isOrbSlug } from "@/lib/orb-catalog";

const orbTitle = (route: ActivatedRouteSnapshot): string => {
  const slug = route.paramMap.get("slug");
  if (!isOrbSlug(slug)) {
    return "Unknown orb";
  }
  const item = ORB_CATALOG_MAP[slug];
  return `${item.title} ${item.name}`;
};

const fieldTitle = (route: ActivatedRouteSnapshot): string => {
  const slug = route.paramMap.get("slug");
  if (!isFieldSlug(slug)) {
    return "Unknown field";
  }
  return FIELD_CATALOG_MAP[slug].title;
};

export const routes: Routes = [
  {
    path: "",
    // Home keeps the full tagline; the TitleStrategy only decorates children.
    title: "",
    loadComponent: () => import("./pages/home-page").then((m) => m.HomePage),
  },
  {
    path: "playground",
    title: "Playground",
    loadComponent: () => import("./pages/playground-page").then((m) => m.PlaygroundPage),
  },
  {
    path: "docs",
    loadComponent: () => import("./layout/docs-layout").then((m) => m.DocsLayout),
    children: [
      {
        path: "",
        title: "Docs",
        loadComponent: () => import("./pages/docs-page").then((m) => m.DocsPage),
      },
      {
        path: "installation",
        title: "Installation",
        loadComponent: () => import("./pages/installation-page").then((m) => m.InstallationPage),
      },
      {
        path: "background",
        title: "Background",
        loadComponent: () => import("./pages/background-page").then((m) => m.BackgroundPage),
      },
      {
        path: "fields",
        title: "Fields",
        loadComponent: () => import("./pages/fields-page").then((m) => m.FieldsPage),
      },
      {
        path: "fields/:slug",
        title: fieldTitle,
        loadComponent: () => import("./pages/field-docs-page").then((m) => m.FieldDocsPage),
      },
      {
        path: "changelog",
        title: "Changelog",
        loadComponent: () => import("./pages/changelog-page").then((m) => m.ChangelogPage),
      },
      {
        path: "credits",
        title: "Credits",
        loadComponent: () => import("./pages/credits-page").then((m) => m.CreditsPage),
      },
      {
        path: "components",
        title: "Components",
        loadComponent: () => import("./pages/components-page").then((m) => m.ComponentsPage),
      },
      {
        path: "components/:slug",
        title: orbTitle,
        loadComponent: () => import("./pages/orb-docs-page").then((m) => m.OrbDocsPage),
      },
    ],
  },
  { path: "**", redirectTo: "" },
];
