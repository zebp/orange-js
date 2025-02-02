// TODO: burn this file with fire
import { Plugin } from "vite";
import { VirtualModule } from "../virtual-module.js";

const EMPTY = new VirtualModule("empty");

const emptyExports = (exports: string[]) => {
  return exports.map((e) => `export const ${e} = undefined;`).join("\n");
}

export function internal(): Plugin[] {
  return [
    {
      name: "orange:shimmed-workflows",
      enforce: "pre",
      applyToEnvironment(environment) {
        return environment.name === "client";
      },
      resolveId(id) {
        if (id === "@orange-js/orange/workflows") {
          return EMPTY.id;
        }
      },
      load(id) {
        if (EMPTY.is(id)) {
          return emptyExports(["start", "get"]);
        }
      },
    },
  ];
}
