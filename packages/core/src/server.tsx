import * as React from "react";
import { renderToString } from "react-dom/server";
import {
  createStaticHandler,
  createStaticRouter,
  StaticRouterProvider,
  matchRoutes,
} from "react-router";

import routes from "virtual:orange/routes";

export function orangeApplication(
  App: ({}: React.PropsWithChildren<{}>) => React.ReactNode,
) {
  const { query, queryRoute, dataRoutes } = createStaticHandler(routes);

  async function handleDataRequest(request: Request, requestContext: unknown) {
    const newRequest =
      request.method !== "GET"
        ? new Request(request.url, {
            method: request.method,
            headers: request.headers,
            // @ts-expect-error this is valid, types are wrong
            body: new URLSearchParams(await request.formData()),
          })
        : new Request(request.url, { headers: request.headers });

    const data = await queryRoute(newRequest, {
      requestContext,
    });
    if (data instanceof Response) {
      return data;
    }

    return Response.json(data);
  }

  async function whatever(request: Request, env: unknown) {
    const requestContext = { cloudflare: { env } };
    if (
      request.method !== "GET" ||
      request.headers.get("Accept")?.includes("application/json") ||
      request.headers.get("upgrade") === "websocket"
    ) {
      return await handleDataRequest(request, requestContext);
    }

    const context = await query(request, {
      requestContext,
    });
    if (context instanceof Response) {
      return context;
    }

    const router = createStaticRouter(dataRoutes, context);

    const html = renderToString(
      <React.StrictMode>
        <App>
          <StaticRouterProvider router={router} context={context} />
        </App>
      </React.StrictMode>,
    );

    const deepestMatch = context.matches[context.matches.length - 1];
    const actionHeaders = context.actionHeaders[deepestMatch.route.id];
    const loaderHeaders = context.loaderHeaders[deepestMatch.route.id];

    const headers = new Headers(actionHeaders);

    if (loaderHeaders) {
      for (const [key, value] of loaderHeaders.entries()) {
        headers.append(key, value);
      }
    }

    headers.set("Content-Type", "text/html; charset=utf-8");
    return new Response(`<!DOCTYPE html>${html}`, {
      status: context.statusCode,
      headers,
    });
  }

  return {
    async fetch(request: Request, env: unknown) {
      const url = new URL(request.url);
      const potentialMatch = matchRoutes(routes, url.pathname);
      if (potentialMatch !== null && potentialMatch.length > 0) {
        const match = potentialMatch.at(-1);
        // @ts-ignore
        if (match?.route.middleware) {
          // @ts-ignore
          const middleware = await match.route.middleware;
          return await middleware({
            request,
            next: () => whatever(request, env),
          });
        }
      }

      return await whatever(request, env);
    },
  };
}
