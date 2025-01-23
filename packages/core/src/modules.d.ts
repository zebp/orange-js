declare module "virtual:orange/routes" {
  import type { RouteObject } from "react-router";

  const routes: RouteObject[];
  export default routes;
}

declare module "virtual:orange/durable-objects" {}

declare module "virtual:orange/client-manifest" {}

declare module "virtual:orange/server-bundle" {
  import type { ServerBuild } from "react-router";

  export const assets: ServerBuild["assets"];
  export const assetsBuildDirectory: ServerBuild["assetsBuildDirectory"];
  export const basename: ServerBuild["basename"];
  export const entry: ServerBuild["entry"];
  export const future: ServerBuild["future"];
  export const isSpaMode: ServerBuild["isSpaMode"];
  export const publicPath: ServerBuild["publicPath"];
  export const routes: ServerBuild["routes"];
}
