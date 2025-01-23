import { unreachable } from "./util.js";
import { ConfigFn, Context } from "./index.js";
import { Manifest, Plugin } from "vite";

export function builder(config: ConfigFn, ctx: Context): Plugin {
  return {
    name: "orange:builder",
    config(userConfig) {
      return {
        ...userConfig,
        environments: {
          client: {
            esbuild: {
              jsx: "automatic",
            },
            build: {
              outDir: "dist/client",
              rollupOptions: {
                input: [
                  "app/entry.client.ts",
                  ...Object.values(config().routes).map((r) => r.file),
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
          },
          server: {
            esbuild: {
              jsx: "automatic",
            },
            build: {
              ssr: true,
              emitAssets: true,
              outDir: "dist/server",
              write: true,
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
          },
        },
        build: {
          manifest: true,
        },
        server: {
          fs: {
            allow: [".."],
            strict: false
          }
        },
        builder: {
          async buildApp(builder) {
            const { client, server } = builder.environments;
            const clientDone = await builder.build(client);
            const outputs = Array.isArray(clientDone)
              ? clientDone
              : "output" in clientDone
              ? [clientDone]
              : unreachable();

            const manifestChunk =
              outputs
                .flatMap((o) => o.output)
                .filter((o) => o.type === "asset")
                .find((o) => o.fileName === ".vite/manifest.json") ??
              unreachable();
            const clientManifest: Manifest = JSON.parse(
              (manifestChunk?.source as string) ?? unreachable()
            );

            const out = outputs.flatMap((o) => o.output);
            const entrypoint =
              out.find((it) => it.type === "chunk" && it.isEntry) ??
              unreachable();

            ctx.clientManifest = clientManifest;

            server.config.define = {
              ...server.config.define,
              // @ts-ignore
              "process.env.CLIENT_BUNDLE": `"${entrypoint.fileName}"`,
            };
            await builder.build(server);
          },
        },
      };
    },
  };
}
