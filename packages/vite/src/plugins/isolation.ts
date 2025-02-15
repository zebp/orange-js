/*
  Allows for creating modules that are isolated from client or server bundles by using
  a `.client` or `.server` suffix.
 */
import { Plugin } from "vite";
import { init, parse } from "es-module-lexer";

export function isolation(): Plugin[] {
  const clientRegex = /.+.client(?:.(?:j|t)sx?)?$/g;
  const serverRegex = /.+.server(?:.(?:j|t)sx?)?$/g;

  return [
    {
      // Prevent client-only modules from being imported in the server bundle
      name: "orange:client-isolation",
      // enforce: "pre",
      applyToEnvironment(environment) {
        return environment.name !== "client";
      },
      // async resolveId(source, importer) {
      //   // TODO: this crashes the dev server
      //   if (importer?.endsWith(".html") || source.startsWith("\x00virtual")) return;

      //   if (clientRegex.test(source)) {
      //     const resolved = await this.resolve(source, importer);
      //     if (!resolved) return;

      //     this.debug(`Client-only module ${source} (${resolved.id}) is being isolated`);

      //     return new VirtualModule(`isolated:${resolved.id}`).id;
      //   }
      // },
      // async load(id) {
      //   const maybeId = VirtualModule.findPrefix("isolated:", id);
      //   if (maybeId) {
      //     const code = await this.load({ id: maybeId });
      //     console.log({ code, id, maybeId })
      //     return emptyExports(code.exports ?? []);
      //   }
      // },
      async transform(code, id) {
        if (clientRegex.test(id)) {
          this.debug(`Client-only module ${id} is being isolated`);

          await init;

          const [_, exports] = parse(code)

          return emptyExports(exports.map(it => it.n));
        }
      },
    },
    {
      // Prevent server-only modules from being imported in the client bundle
      name: "orange:server-isolation",
      // enforce: "pre",
      applyToEnvironment(environment) {
        return environment.name === "client";
      },
      // async resolveId(source, importer) {
      //   // TODO: this crashes the dev server
      //   if (importer?.endsWith(".html")) return;

      //   if (serverRegex.test(source)) {
      //     const resolved = await this.resolve(source, importer);
      //     if (!resolved) return;

      //     this.debug(`Server-only module ${source} (${resolved.id}) is being isolated`);

      //     return new VirtualModule(`isolated:${resolved.id}`).id;
      //   }
      // },
      // async load(id) {
      //   const maybeId = VirtualModule.findPrefix("isolated:", id);
      //   if (maybeId) {
      //     const code = await this.load({ id: maybeId });
      //     return emptyExports(code.exports ?? []);
      //   }
      // },
      async transform(code, id) {
        if (serverRegex.test(id)) {
          this.debug(`Server-only module ${id} is being isolated`);

          await init;

          const [_, exports] = parse(code)

          return emptyExports(exports.map(it => it.n));
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
