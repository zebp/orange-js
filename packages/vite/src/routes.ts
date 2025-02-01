import fs from "node:fs";
import { flatRoutes } from "@react-router/fs-routes";
import { unreachable } from "./util.js";

function loadRoute(file: string) {
  const contents = fs.readFileSync(file, "utf-8");
  return {
    hasLoader:
      contents.includes("export async function loader") ||
      contents.includes("async loader()") ||
      contents.includes("async webSocketConnect("),
    hasAction:
      contents.includes("export async function action") ||
      contents.includes("async action("),
    hasClientLoader: contents.includes("export async function clientLoader"),
    hasClientAction: contents.includes("export async function clientAction"),
    exportedClasses:
      contents
        .match(/export class (\w+)/g)
        ?.map((it) => it.replace("export class ", "")) ?? [],
  };
}

export interface RouteManifestEntry {
  /**
   * The path this route uses to match on the URL pathname.
   */
  path?: string;
  /**
   * The unique id for this route, named like its `file` but without the
   * extension. So `app/routes/gists/$username.tsx` will have an `id` of
   * `routes/gists/$username`.
   */
  id: string;

  /**
   * The unique `id` for this route's parent route, if there is one.
   */
  parentId?: string;

  /**
   * The path to the entry point for this route, relative to
   * `config.appDirectory`.
   */
  file: string;
  index?: boolean;
  hasAction?: boolean;
  hasLoader?: boolean;
  hasClientAction?: boolean;
  hasClientLoader?: boolean;
  hasErrorBoundary?: boolean;
  exportedClasses?: string[];
}

export interface RouteManifest {
  [routeId: string]: RouteManifestEntry;
}

type RouteConfigEntry = Awaited<ReturnType<typeof flatRoutes>>[number];

export function loadRoutes(routes: RouteConfigEntry[]): RouteManifest {
  const root: RouteManifestEntry = {
    id: "root",
    file: "app/root.tsx",
    path: "",
    ...loadRoute("app/root.tsx"),
  };
  const manifest: RouteManifest = { root };

  const recurse = (route: RouteConfigEntry, parentId?: string) => {
    if (route.id === undefined) unreachable();

    manifest[route.id] = {
      id: route.id,
      parentId,
      ...route,
      file: `app/${route.file}`,
      ...loadRoute(`app/${route.file}`),
    };

    if (route.children) {
      route.children.forEach((child) => recurse(child, route.id));
    }
  }

  routes.forEach((route) => recurse(route, "root"));

  return manifest;
}
