import { Plugin } from "vite";
import * as fs from "node:fs/promises";
import { orangeRoute, loadRoutes, routesPlugin } from "./routes.js";
import {
  durableObjectRoutes,
  durableObjectsVirtualModule,
} from "./durable-objects.js";
import { workerStub } from "./worker-stub.js";
import { builder } from "./build.js";

export type MiddlewareArgs = {
  request: Request;
  next: () => Promise<Response>;
};

export type Config = {
  routes: orangeRoute[];
  setRoutes: (routes: orangeRoute[]) => void;
  ssr: boolean;
};

export type ConfigFn = () => Config;

export default function (): Plugin | Plugin[] {
  const configFn = () => config;
  const config: Config = {
    routes: [],
    setRoutes: (routes: orangeRoute[]) => (config.routes = routes),
    ssr: false,
  };

  return [
    {
      name: "orange:route-plugin",
      enforce: "pre",
      async config() {
        const routeEntries = await fs.readdir("app/routes");
        const routeFiles = routeEntries
          .filter((it) => it.endsWith(".tsx"))
          .map((it) => `app/routes/${it}`);

        config.setRoutes(loadRoutes(routeFiles));
      },
      configResolved(userConfig) {
        config.ssr = Boolean(userConfig.build.ssr);
      },
    },
    builder(configFn),
    workerStub(configFn),
    durableObjectRoutes(configFn),
    routesPlugin(configFn),
    durableObjectsVirtualModule(configFn),
  ];
}
