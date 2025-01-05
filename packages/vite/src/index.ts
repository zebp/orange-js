import { Manifest, Plugin } from "vite";
import * as fs from "node:fs/promises";
import { loadRoutes, RouteManifest } from "./routes.js";
import {
  durableObjectRoutes,
  durableObjectsVirtualModule,
} from "./durable-objects.js";
import { workerStub } from "./worker-stub.js";
import { builder } from "./build.js";
import { serverBundle } from "./server-bundle.js";
import { cloudflare } from "@cloudflare/vite-plugin";

export type MiddlewareArgs = {
  request: Request;
  next: () => Promise<Response>;
};

export type Config = {
  routes: RouteManifest;
  setRoutes: (routes: RouteManifest) => void;
  ssr: boolean;
};

export type ConfigFn = (opt?: Partial<Config>) => Config;

export type Context = {
  routes: RouteManifest | undefined;
  clientManifest: Manifest | undefined;
};

const ctx: Context = { routes: undefined, clientManifest: undefined };

export type PluginConfig = {
  cloudflare?: any;
}

export default function ({ cloudflare: cloudflareCfg }: PluginConfig = {}): Plugin | Plugin[] {
  const configFn = (opt?: Partial<Config>) => {
    if (opt) {
      config = { ...config, ...opt };
    }
    return config;
  };
  let config: Config = {
    routes: {},
    setRoutes: (routes: RouteManifest) => (config.routes = routes),
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

        const routes = loadRoutes(routeFiles);
        config.setRoutes(routes);
        ctx.routes = routes;
      },
      configResolved(userConfig) {
        config.ssr = Boolean(userConfig.build.ssr);
      },
    },
    builder(configFn, ctx),
    workerStub(configFn),
    durableObjectRoutes(configFn),
    durableObjectsVirtualModule(configFn),
    serverBundle(configFn, ctx),
    // cloudflare(cloudflareCfg) as unknown as any,
  ];
}
