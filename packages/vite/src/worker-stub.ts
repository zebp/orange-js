import { Plugin } from "vite";
import { ConfigFn } from "./index.js";
import { VirtualModule } from "./virtual-module.js";

const workersVmod = new VirtualModule("workers-stub");

export function workerStub(config: ConfigFn): Plugin {
  return {
    name: "orange:worker-stub",
    resolveId(id) {
      if (id === "cloudflare:workers" && !config().ssr) {
        return workersVmod.id;
      }
    },
    load(id) {
      if (workersVmod.is(id) && !config().ssr) {
        return "export class DurableObject {};";
      }
    },
  };
}
