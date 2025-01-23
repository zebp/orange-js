import { act } from "react";
import {
  createRequestHandler,
  createStaticHandler,
  RouteObject,
} from "react-router";

import * as serverBundle from "virtual:orange/server-bundle";

export function orangeApplication() {
  const handler = createRequestHandler(serverBundle);

  // This is a big ol' hack, but I think it's okay
  const { queryRoute } = createStaticHandler(routeObjects);

  return {
    async fetch(request: Request, env: unknown) {
      const requestContext = { cloudflare: { env } };
      if (request.headers.get("upgrade") === "websocket") {
        return await queryRoute(request, { requestContext });
      }

      return await handler(request, requestContext);
    },
  };
}

const routeObjects: RouteObject[] = Object.values(serverBundle.routes)
  .filter((it) => it !== undefined)
  .map((route) => ({
    id: route.id,
    path: route.path,
    index: route.index,
    loader: route.module.loader,
    caseSensitive: route.caseSensitive,
  }));
