import { Plugin } from "vite";
import { resolve } from "node:path";

import { ConfigFn } from "./index.js";
import { VirtualModule } from "./virtual-module.js";

const DO_VIRTUAL_MODULE_ID = new VirtualModule("durable-objects");

export function durableObjectsVirtualModule(config: ConfigFn): Plugin {
  return {
    name: "orange:durable-object-virtual-module",
    enforce: "pre",
    resolveId(id) {
      if (DO_VIRTUAL_MODULE_ID.is(id)) {
        return id;
      }
    },
    load(id) {
      if (DO_VIRTUAL_MODULE_ID.is(id)) {
        const { routes } = config();
        let body = "";

        for (const route of routes) {
          if (route.exportedClasses.length === 0) {
            continue;
          }

          body += `export { ${route.exportedClasses.join(", ")} } from "/${
            route.file
          }";\n`;
        }

        return body;
      }
    },
  };
}

export function durableObjectRoutes(config: ConfigFn): Plugin {
  return {
    name: "orange:durable-object-routes",
    enforce: "pre",
    async transform(code, id) {
      const { routes } = config();

      const routeFiles = routes.map((route) => resolve(route.file));
      if (!routeFiles.includes(id)) {
        return;
      }

      if (!contentsAreDurable(code)) {
        return;
      }

      const className = durableObjectInCode(code);
      const ret = `${code}\n
      export async function loader(args) {
        const id = typeof durableIdentifier === "string" ? durableIdentifier : durableIdentifier(args);
        const obj = args.context.cloudflare.env.${className};
        const objectId = obj.idFromName(id);
        const durableObject = obj.get(objectId);
        const resp = await durableObject.fetch(args.request);
        if (resp.status === 101) {
          return resp;
        }

        return await resp.json();
      }

      export async function action(args) {
        const id = typeof durableIdentifier === "string" ? durableIdentifier : durableIdentifier(args);
        const obj = args.context.cloudflare.env.${className};
        const objectId = obj.idFromName(id);
        const durableObject = obj.get(objectId);
        const resp = await durableObject.fetch(args.request);
        if (resp.status === 101) {
          return resp;
        }

        return await resp.json();
      }`;

      return ret;
    },
  };
}

function durableObjectInCode(contents: string): string {
  const matches = /export\s+class\s+(\w+)\s+extends\s+RouteDurableObject/.exec(
    contents,
  );
  if (!matches || !matches[1]) {
    throw new Error("Could not find class that extends DurableObject");
  }

  return matches[1];
}

const contentsAreDurable = (contents: string) =>
  contents.includes("durableIdentifier");
