import {
  createRequestHandler,
  createStaticHandler,
  type ServerBuild,
  type RouteObject,
} from "react-router";

export function app(serverBuild: ServerBuild) {
  const handler = createRequestHandler(serverBuild);
  const routeObjects: RouteObject[] = Object.values(serverBuild.routes)
    .filter((it) => it !== undefined)
    .map((route) => ({
      id: route.id,
      path: route.path,
      index: route.index,
      loader: route.module.loader,
      caseSensitive: route.caseSensitive,
    }));

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
