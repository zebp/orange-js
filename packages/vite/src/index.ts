import type { Manifest, Plugin } from "vite";
import * as fs from "node:fs/promises";
import { cloudflare } from "@cloudflare/vite-plugin";
import { loadRoutes, type RouteManifest } from "./routes.js";
import {
  durableObjectRoutes,
  durableObjectsVirtualModule,
} from "./plugins/durable-objects.js";
import { workerStub } from "./plugins/worker-stub.js";
import { clientBuilder, serverBuilder } from "./plugins/build.js";
import { serverBundle } from "./plugins/server-bundle.js";
import { hmr } from "./plugins/hmr.js";

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
  cloudflare?: Parameters<typeof cloudflare>[0];
};

export default function ({
  cloudflare: cloudflareCfg,
}: PluginConfig = {}): Plugin | Plugin[] {
  return [
    cloudflare(cloudflareCfg) as unknown as Plugin,
    {
      name: "orange:route-plugin",
      enforce: "pre",
      async config(userConfig) {
        const routeEntries = await fs.readdir("app/routes");
        const routeFiles = routeEntries
          .filter((it) => it.endsWith(".tsx"))
          .map((it) => `app/routes/${it}`);

        ctx.routes = loadRoutes(routeFiles);

        return {
          ...userConfig,
          build: {
            ...userConfig.build,
            rollupOptions: {
              ...userConfig.build?.rollupOptions,
              external: ["cloudflare:workers"],
            },
          },
          optimizeDeps: {
            ...userConfig.optimizeDeps,
            exclude: [
              "cloudflare:workers",
              "cloudflare:env",
              ...(userConfig.optimizeDeps?.exclude ?? []),
            ],
          },
        };
      },
    },
    clientBuilder(ctx),
    serverBuilder(),
    workerStub(),
    durableObjectRoutes(ctx),
    durableObjectsVirtualModule(ctx),
    serverBundle(ctx),
    ...hmr(),
  ];
}
