/*
  Allows for creating modules that are isolated from client or server bundles by using
  a `.client` or `.server` suffix.
 */
import { Plugin } from "vite";
import { Context } from "../index.js";

export function isolation(ctx: Context): Plugin[] {
  const clientRegex = /.+.client(?:.(?:j|t)sx?)?$/g;
  const serverRegex = /.+.server(?:.(?:j|t)sx?)?$/g;

  return [
    {
      name: "orange:client-isolation",
      resolveId(source, importer) {
        // Only apply this plugin if the client manifest is available, (ie. we're building the server bundle)
        if (ctx.clientManifest !== undefined && clientRegex.test(source)) {
          throw new Error(
            `${source} was imported in the server bundle, but is a client-only module. Importer: ${importer}`,
          );
        }
      },
    },
    {
      name: "orange:server-isolation",
      resolveId(source, importer) {
        // Only apply this plugin if the client manifest isn't available, (ie. we're building the client bundle)
        if (ctx.clientManifest === undefined && serverRegex.test(source)) {
          throw new Error(
            `${source} was imported in the client bundle, but is a server-only module. Importer: ${importer}`,
          );
        }
      },
    },
  ];
}
