/*
  Allows for creating modules that are isolated from client or server bundles by using
  a `.client` or `.server` suffix.
 */
import { Plugin } from "vite";
import { Context } from "../index.js";

export function isolation(): Plugin[] {
  const clientRegex = /.+.client(?:.(?:j|t)sx?)?$/g;
  const serverRegex = /.+.server(?:.(?:j|t)sx?)?$/g;

  return [
    {
      // Prevent client-only modules from being imported in the server bundle
      name: "orange:client-isolation",
      enforce: "pre",
      applyToEnvironment(environment) {
        return environment.name !== "client";
      },
      resolveId(source, importer) {
        // TODO: this crashes the dev server
        if (importer?.endsWith(".html")) return;

        if (clientRegex.test(source)) {
          this.error(
            `${source} was imported in the server bundle, but is a client-only module. Importer: ${importer}`,
          );
        }
      },
    },
    {
      // Prevent server-only modules from being imported in the client bundle
      name: "orange:server-isolation",
      enforce: "pre",
      applyToEnvironment(environment) {
        return environment.name === "client";
      },
      resolveId(source, importer) {
        // TODO: this crashes the dev server
        if (importer?.endsWith(".html")) return;

        if (serverRegex.test(source)) {
          this.error(
            `${source} was imported in the client bundle, but is a server-only module. Importer: ${importer}`,
          );
        }
      },
    },
  ];
}
