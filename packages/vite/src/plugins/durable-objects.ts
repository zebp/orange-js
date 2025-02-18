import type { Plugin } from "vite";
import { resolve } from "node:path";

import type { Context } from "../index.js";
import { unreachable } from "../util.js";

export function durableObjectRoutes(ctx: Context): Plugin {
  return {
    name: "orange:durable-object-routes",
    enforce: "pre",
    applyToEnvironment(environment) {
      return environment.name !== "client";
    },
    async transform(code, id) {
      const routes = ctx.componentRoutes ?? unreachable();
      const routeFiles = Object.values(routes).map((route) =>
        resolve(route.file),
      );
      if (!routeFiles.includes(id)) {
        return;
      }

      const className = durableObjectInCode(code);
      if (!className) {
        return;
      }

      const ret = `${code}\n
      export async function loader(args) {
        const env = args.context?.cloudflare.env as unknown as Env;
        if (!env) {
          throw new Error("No env found in context");
        }

        const namespace = env.${className};
        const name = typeof ${className}.id === "string" ? ${className}.id : ${className}.id(args);
        if (name === undefined) {
          throw new Error("DurableObject did not have a static id function specified");
        }
        const doID = namespace.idFromName(name);
        const stub = namespace.get(doID);

        if (args.request.headers.get("Upgrade") === "websocket") {
          const modifiedRequest = new Request(args.request, {
            headers: new Headers({
              ...Object.fromEntries(args.request.headers),
              "x-orange-params": JSON.stringify(args.params),
            })
          });

          return await stub.fetch(modifiedRequest);
        }

        delete args.context;
        delete args.env;

        return await (stub as any).loader(args);
      }

      export async function action(args) {
        const env = args.context?.cloudflare.env as unknown as Env;
        if (!env) {
          throw new Error("No env found in context");
        }

        const namespace = env.${className};
        const name = typeof ${className}.id === "string" ? ${className}.id : ${className}.id(args);
        if (name === undefined) {
          throw new Error("DurableObject did not have a static id function specified");
        }
        const doID = namespace.idFromName(name);
        const stub = namespace.get(doID);

        if (args.request.headers.get("Upgrade") === "websocket") {
          const modifiedRequest = new Request(args.request, {
            headers: new Headers({
              ...Object.fromEntries(args.request.headers),
              "x-orange-params": JSON.stringify(args.params),
            })
          });

          return await stub.fetch(modifiedRequest);
        }

        delete args.context;
        delete args.env;

        return await (stub as any).action(args);
      }`;

      return ret;
    },
  };
}

function durableObjectInCode(contents: string): string | undefined {
  const matches = /export\s+class\s+(\w+)\s+extends\s+RouteDurableObject/.exec(
    contents,
  );
  if (!matches || !matches[1]) {
    return undefined;
  }

  return matches[1];
}
