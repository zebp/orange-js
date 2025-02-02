import * as React from "react";

export { useWebsocket } from "./websocket.js";
export {
  RouteDurableObject,
  useDurableObject,
  actionIn,
  data,
  loaderIn,
} from "./durable-object.js";
export type * from "./durable-object.js";

export * from "react-router";

export interface CloudflareEnv {}

import type * as rr from "react-router";

export type ActionFunctionArgs = rr.ActionFunctionArgs<{
  cloudflare: { env: CloudflareEnv };
}>;

export type LoaderFunctionArgs = rr.LoaderFunctionArgs<{
  cloudflare: { env: CloudflareEnv };
}>;

