import type { Plugin } from "vite";
import { VirtualModule } from "../virtual-module.js";

const workersVmod = new VirtualModule("workers-stub");

// Replaces the `cloudflare:workers` import with an empty module for the client.
export function workerStub(): Plugin {
  return {
    name: "orange:worker-stub",
    applyToEnvironment(environment) {
      return environment.name === "client";
    },
    resolveId(id) {
      if (id === "cloudflare:workers") {
        return workersVmod.id;
      }
    },
    load(id) {
      if (workersVmod.is(id)) {
        return `
          export class DurableObject {};
          export class RpcStub {};
          export class WorkflowEntrypoint {};
        `;
      }
    },
  };
}
