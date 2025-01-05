import * as React from "react";

export { useWebsocket } from "./websocket.js";
export {
  RouteDurableObject,
  actionIn,
  loaderIn,
  actionUsing,
  loaderUsing,
  useDurableObject,
} from "./durable-object.js";
export type * from "./durable-object.js";

export * from "react-router";

export function Scripts() {
  // @ts-ignore
  if (!process.env.CLIENT_BUNDLE) return null;
  // @ts-ignore
  return <script defer type="module" src={process.env.CLIENT_BUNDLE}></script>;
}
