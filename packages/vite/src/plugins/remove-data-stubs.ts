import * as path from "node:path";
import { Plugin } from "vite";
import { Context } from "../index.js";
import { unreachable } from "../util.js";
import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
import {
  isClassDeclaration,
  isIdentifier,
  isVariableDeclaration,
  exportNamedDeclaration,
  classDeclaration,
  classBody,
} from "@babel/types";
import _generate from "@babel/generator";
const traverse = _traverse.default;
const generate = _generate.default;

const namesToStrip = ["action", "loader"];
const baseClassesToStrip = [
  "WorkerEntrypoint",
  "WorkflowEntrypoint",
  "RouteDurableObject",
  "DurableObject",
];
const allNamesToStrip = [...namesToStrip, ...baseClassesToStrip];

export function removeDataStubs(ctx: Context): Plugin {
  return {
    name: "orange:remove-data-stubs",
    applyToEnvironment(environment) {
      return environment.name === "client";
    },
    async transform(code, id, options) {
      const routes = ctx.routes ?? unreachable();
      const isRouteModule = Object.values(routes)
        .map((route) => path.resolve(route.file))
        .some((path) => path === id);

      if (!isRouteModule) return;

      // Optimization: if the code doesn't contain any of the names we're looking for, skip parsing
      if (!allNamesToStrip.some((name) => code.includes(name))) {
        return;
      }

      const parsed = parse(code, {
        sourceType: "module",
      });

      let stripped = false;

      traverse(parsed, {
        ExportNamedDeclaration(path) {
          const node = path.node;

          if (isVariableDeclaration(node.declaration)) {
            const declarations = node.declaration.declarations;
            for (let i = 0; i < declarations.length; i++) {
              const declaration = declarations[i];

              if (
                isIdentifier(declaration.id) &&
                namesToStrip.includes(declaration.id.name)
              ) {
                stripped = true;
                declarations.splice(i, 1);
              }
            }

            if (declarations.length === 0) {
              path.remove();
            }
          } else if (isClassDeclaration(node.declaration)) {
            const { superClass } = node.declaration;

            if (
              superClass &&
              isIdentifier(superClass) &&
              baseClassesToStrip.includes(superClass.name)
            ) {
              stripped = true;

              // TODO: remove the class declaration entirely without imports complaining
              path.replaceWith(
                exportNamedDeclaration(
                  classDeclaration(
                    node.declaration.id,
                    null,
                    classBody([]),
                    null
                  )
                )
              );
            }
          }
        },
      });

      if (stripped) {
        const output = generate(parsed);
        return output.code;
      }
    },
  };
}
