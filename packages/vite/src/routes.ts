import fs from "node:fs";
import { Plugin } from "vite";

import { VirtualModule } from "./virtual-module.js";
import { ConfigFn } from "./index.js";

const routesVirtualId = new VirtualModule("routes");

export function routesPlugin(config: ConfigFn): Plugin {
  return {
    name: "orange:route-plugin",
    enforce: "pre",
    resolveId(id) {
      if (routesVirtualId.is(id)) {
        return routesVirtualId.id;
      }
    },
    async load(id) {
      if (routesVirtualId.is(id)) {
        const { routes } = config();
        const routeImport = (route: orangeRoute, index: number) => {
          return `import * as route${index} from "/${route.file}";`;
        };

        const ret = `
        ${routes.map(routeImport).join("\n")}

        function addDataHeader(request, obj) {
          request.headers.set("Accept", "application/json");
          request.headers.set("X-Route-Id", obj.id)
          return request;
        }

        function route(obj) {
					const middleware = obj.middleware !== undefined && import.meta.env.SSR ? obj.middleware : undefined;

          const loader = !obj.loader ? undefined : import.meta.env.SSR
            ? obj.loader
            : ({ request }) =>
                fetch(addDataHeader(request, obj));

          const action = !obj.action ? undefined : import.meta.env.SSR
            ? obj.action
            : ({ request }) =>
                fetch(addDataHeader(request, obj));

          return {
            ...obj,
            loader,
            action,
						middleware,
          };
        }

        export default [
          ${routes
            .map((route, index) => {
              return `route({
                id: "route-${route.path}",
                path: "/${route.path}",
                Component: route${index}.default,
                children: [],
								${route.middleware ? `middleware: route${index}.middleware,` : ""}
                ${route.loader ? `loader: route${index}.loader,` : ""}
                ${route.action ? `action: route${index}.action,` : ""}
              })`;
            })
            .join(",\n")}
        ];
        `;
        return ret;
      }
    },
  };
}

function path(file: string): string {
  return file
    .replace("app/routes/", "")
    .replace(".tsx", "")
    .replace("_index", "");
}

export type orangeRoute = {
  file: string;
  path: string;
  middleware: boolean;
  loader: boolean;
  action: boolean;
  exportedClasses: string[];
};

function loadRoute(file: string): orangeRoute {
  const contents = fs.readFileSync(file, "utf-8");
  return {
    file,
    path: path(file),
    middleware: contents.includes("export async function middleware"),
    loader:
      contents.includes("export async function loader") ||
      contents.includes("async loader()") ||
      contents.includes("async webSocketConnect("),
    action:
      contents.includes("export async function action") ||
      contents.includes("async action("),
    exportedClasses:
      contents
        .match(/export class (\w+)/g)
        ?.map((it) => it.replace("export class ", "")) ?? [],
  };
}

export function loadRoutes(routes: string[]) {
  return routes.map(loadRoute);
}
