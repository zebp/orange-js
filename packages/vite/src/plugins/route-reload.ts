import { Plugin, ViteDevServer } from "vite";
import * as path from "node:path";

// Prevent double reload for file renames
let reloadCount = 0;

async function forceReload(server: ViteDevServer, reloadId: number) {
  if (reloadId !== reloadCount) {
    return;
  }

  // TODO: This is a hack to force a full reload
  await server.restart();
  server.ws.send({ type: "full-reload" });
}

export function routeReload(): Plugin {
  return {
    name: "orange:reload-routes",
    async configureServer(server) {
      const routeDir = path.resolve("./app/routes");
      const onFileChange = async (filePath: string) => {
        if (filePath.startsWith(routeDir)) {
          const reloadId = ++reloadCount;
          setTimeout(() => forceReload(server, reloadId), 20);
        }
      };

      server.watcher.on("add", onFileChange);
      server.watcher.on("unlink", onFileChange);
    },
  };
}
