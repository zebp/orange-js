/*
  Allows for creating modules that are isolated from client or server bundles by using
  a `.client` or `.server` suffix.
 */
import { Plugin } from "vite";
import { VirtualModule } from "../virtual-module.js";

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
      async resolveId(source, importer) {
        // TODO: this crashes the dev server
        if (importer?.endsWith(".html")) return;

        if (clientRegex.test(source)) {
          const resolved = await this.resolve(source, importer);
          if (!resolved) return;

          this.debug(`Client-only module ${source} (${resolved.id}) is being isolated`);

          return new VirtualModule(`isolated/${resolved.id}`).id;
        }
      },
      async load(id) {
        const maybeId = VirtualModule.findPrefix("isolated/", id);
        if (maybeId) {
          const code = await this.load({ id: maybeId });
          return emptyExports(code.exports ?? []);
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
      async resolveId(source, importer) {
        // TODO: this crashes the dev server
        if (importer?.endsWith(".html")) return;

        if (serverRegex.test(source)) {
          const resolved = await this.resolve(source, importer);
          if (!resolved) return;

          this.debug(`Server-only module ${source} (${resolved.id}) is being isolated`);

          return new VirtualModule(`isolated/${resolved.id}`).id;
        }
      },
      async load(id) {
        const maybeId = VirtualModule.findPrefix("isolated/", id);
        if (maybeId) {
          const code = await this.load({ id: maybeId });
          return emptyExports(code.exports ?? []);
        }
      },
    },
  ];
}

const emptyExports = (exports: string[]) => {
  return exports
    .map((e) =>
      e === "default"
        ? "export default undefined;"
        : `export const ${e} = undefined;`
    )
    .join("\n");
};
