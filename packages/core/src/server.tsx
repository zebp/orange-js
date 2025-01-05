import { createRequestHandler } from "react-router";

import * as serverBundle from "virtual:orange/server-bundle";

export function orangeApplication() {
  const handler = createRequestHandler(serverBundle);

  return {
    async fetch(request: Request, env: unknown) {
      return await handler(request, { cloudflare: { env } });
    },
  };
}
