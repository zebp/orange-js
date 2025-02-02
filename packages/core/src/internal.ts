import { AsyncLocalStorage } from "node:async_hooks";

export const _env = new AsyncLocalStorage<any>();

export function env() {
  return _env.getStore();
}
