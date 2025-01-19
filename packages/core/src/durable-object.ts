import { DurableObject } from "cloudflare:workers";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";

export type IdentifierFunctionArgs = LoaderFunctionArgs;

export type DurableLoaderFunctionArgs = {
  request: Request;
};

export type DurableActionFunctionArgs = {
  request: Request;
};

export class RouteDurableObject<Env> extends DurableObject<Env> {
  override async fetch(request: Request): Promise<Response> {
    if (
      this.webSocketConnect &&
      request.headers.get("Upgrade") === "websocket"
    ) {
      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];
      const resp = await this.webSocketConnect(client, server, request);
      return resp;
    }

    if (request.method === "GET" && this.loader) {
      const data = await this.loader({ request });
      return Response.json(data);
    }
    if (this.action) {
      const data = await this.action({ request });
      return Response.json(data);
    }
    return Response.json({ error: "Method not allowed" }, { status: 405 });
  }

  loader?(args: DurableLoaderFunctionArgs): Promise<unknown>;
  action?(args: DurableActionFunctionArgs): Promise<unknown>;
  webSocketConnect?(
    client: WebSocket,
    server: WebSocket,
    request: Request,
  ): Promise<Response>;
}

type Syncify<T> = T extends Promise<infer U> ? U : T;

type SerializeLoaderFrom<
  T extends RouteDurableObject<unknown>,
  Key extends keyof T = "loader",
> = Syncify<
  ReturnType<T[Key] extends (...args: any[]) => any ? T[Key] : never>
>;

export function useDurableObject<
  Obj extends RouteDurableObject<unknown>,
>(): SerializeLoaderFrom<Obj> {
  return useLoaderData() as SerializeLoaderFrom<Obj>;
}

export function loaderIn<
  Obj extends RouteDurableObject<unknown>,
  Key extends keyof Obj,
  Env,
>(
  durableObject: new (ctx: DurableObjectState, env: Env) => Obj,
  method: Key,
): () => SerializeLoaderFrom<Obj, Key> {
  throw new Error("This function should be removed by the Vite plugin");
}

export function loaderUsing<Obj extends RouteDurableObject<unknown>, Env, T>(
  object: new (ctx: DurableObjectState, env: Env) => Obj,
  p: {
    loader: (this: Obj, args: DurableLoaderFunctionArgs) => T | Promise<T>;
  },
): () => T {
  throw new Error("This function should be removed by the Vite plugin");
}

export function actionIn<
  Obj extends RouteDurableObject<unknown>,
  Key extends keyof Obj,
  Env,
>(
  durableObject: new (ctx: DurableObjectState, env: Env) => Obj,
  method: Key,
): () => SerializeLoaderFrom<Obj, Key> {
  throw new Error("This function should be removed by the Vite plugin");
}

export function actionUsing<Obj extends RouteDurableObject<unknown>, Env, T>(
  object: new (ctx: DurableObjectState, env: Env) => Obj,
  p: {
    action: (this: Obj, args: DurableActionFunctionArgs) => T | Promise<T>;
  },
): () => T {
  throw new Error("This function should be removed by the Vite plugin");
}
