import { useLocation, useMatches } from "react-router";
import { bail } from "./util.js";
import { useEffect, useState } from "react";

type OnMessage = (event: MessageEvent) => void;

export function useWebsocket(callback: OnMessage) {
  const location = useLocation();
  const route = useMatches().at(-1) ?? bail("No route");

  const [webSocket, setWebSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    const webSocket = new WebSocket(
      `${location.pathname}?x-route-id=${route.id}`,
    );
    setWebSocket(webSocket);

    webSocket.onmessage = callback;

    return () => {
      webSocket.close();
    };
  }, [route.id, location.pathname, callback]);

  return (message: string | ArrayBuffer | ArrayBufferLike) =>
    webSocket?.send(message);
}
``;
