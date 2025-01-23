import { assert, unreachable } from "../util.js";
import type { Context } from "../index.js";
import type { Manifest, Plugin } from "vite";

export function clientBuilder(ctx: Context): Plugin {
  return {
    name: "orange:client-builder",
    enforce: "pre",
    writeBundle(_, bundle) {
      const manifestChunk = bundle[".vite/manifest.json"];
      assert("source" in manifestChunk, "missing manifest chunk");
      const clientManifest: Manifest = JSON.parse(
        (manifestChunk?.source as string) ?? unreachable(),
      );

      ctx.clientManifest = clientManifest;
    },
    applyToEnvironment(environment) {
      return environment.name === "client";
    },
    configEnvironment(name, envConfig) {
      if (name !== "client") return envConfig;

      const routes = ctx.routes ?? unreachable();
      return {
        ...envConfig,
        build: {
          manifest: true,
          outDir: "dist/client",
          target: "es2022",
          rollupOptions: {
            input: [
              "app/entry.client.ts",
              ...Object.values(routes).map((r) => r.file),
            ],
            preserveEntrySignatures: "exports-only",
          },
        },
        optimizeDeps: {
          include: [
            // Pre-bundle React dependencies to avoid React duplicates,
            // even if React dependencies are not direct dependencies.
            // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom",
            "react-dom/client",

            // Pre-bundle router dependencies to avoid router duplicates.
            // Mismatching routers cause `Error: You must render this element inside a <Remix> element`.
            "react-router",
            "react-router/dom",
          ],
        },
        resolve: {
          dedupe: ["react", "react-dom", "react-router"],
        },
      };
    },
  };
}

export function serverBuilder(): Plugin {
  return {
    name: "orange:server-builder",
    enforce: "pre",
    applyToEnvironment(environment) {
      return environment.name !== "client";
    },
    configEnvironment(name, config, env) {
      if (name === "client") return config;

      return {
        ...config,
        build: {
          ssr: true,
          emitAssets: true,
          outDir: `dist/${name}`,
          write: true,
          target: "es2022",
          rollupOptions: {
            input: "app/entry.server.ts",
            external: ["cloudflare:workers"],
          },
        },
        optimizeDeps: {
          include: [
            // Pre-bundle React dependencies to avoid React duplicates,
            // even if React dependencies are not direct dependencies.
            // https://react.dev/warnings/invalid-hook-call-warning#duplicate-react
            "react",
            "react/jsx-runtime",
            "react/jsx-dev-runtime",
            "react-dom",
            "react-dom/server.edge",

            // Pre-bundle router dependencies to avoid router duplicates.
            // Mismatching routers cause `Error: You must render this element inside a <Remix> element`.
            "react-router",
            "react-router/dom",
          ],
        },
        resolve: {
          dedupe: [
            "react",
            "react-dom",
            "react-router",
            "react-dom/server.edge",
          ],
        },
      };
    },
  };
}
