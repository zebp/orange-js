import * as React from "react";
import { hydrateRoot } from "react-dom/client";
import routes from "virtual:orange/routes";
import { createBrowserRouter, RouterProvider } from "react-router";

export const router = createBrowserRouter(routes, {
  // @ts-expect-error
  hydrationData: window.__staticRouterHydrationData,
});

export function hydrate(
  App: ({}: React.PropsWithChildren<{}>) => React.ReactNode,
) {
  hydrateRoot(
    document,
    <React.StrictMode>
      <App>
        <RouterProvider router={router} />
      </App>
    </React.StrictMode>,
  );
}
