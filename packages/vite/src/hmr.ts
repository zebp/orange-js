import { Plugin } from "vite";
import * as fs from "node:fs/promises";
import * as path from "node:path";
import { VirtualModule } from "./virtual-module.js";

export const virtualInjectHmrRuntime = new VirtualModule("inject-hmr-runtime");
const virtualHmrRuntime = new VirtualModule("hmr-runtime");

export function hmr(): Plugin[] {
  return [
    {
      name: "react-router:inject-hmr-runtime",
      enforce: "pre",
      resolveId(id) {
        if (virtualInjectHmrRuntime.is(id)) {
          return virtualInjectHmrRuntime.id;
        }
      },
      async load(id) {
        if (!virtualInjectHmrRuntime.is(id)) return;

        return [
          `import RefreshRuntime from "${virtualHmrRuntime.raw}"`,
          "RefreshRuntime.injectIntoGlobalHook(window)",
          "window.$RefreshReg$ = () => {}",
          "window.$RefreshSig$ = () => (type) => type",
          "window.__vite_plugin_react_preamble_installed__ = true",
        ].join("\n");
      },
    },
    {
      name: "react-router:hmr-runtime",
      enforce: "pre",
      resolveId(id) {
        if (virtualHmrRuntime.is(id)) {
          return virtualHmrRuntime.id;
        }
      },
      async load(id) {
        if (!virtualHmrRuntime.is(id)) return;

        let reactRefreshDir = path.dirname(
          import.meta.resolve("react-refresh/package.json").replace("file://", "")
        );
        let reactRefreshRuntimePath = path.join(
          reactRefreshDir,
          "cjs/react-refresh-runtime.development.js"
        );

        return [
          "const exports = {}",
          await fs.readFile(reactRefreshRuntimePath, "utf8"),
          "export default exports",
        ].join("\n");
      },
    },
  ];
}
