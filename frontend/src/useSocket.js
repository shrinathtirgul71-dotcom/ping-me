import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

const SERVER_URL = "https://ping-me-opwf.onrender.com";

let socket;

export function useSocket(onPing) {
  const callbackRef = useRef(onPing);
  callbackRef.current = onPing;

  useEffect(() => {
    if (!socket) {
      socket = io(SERVER_URL);
    }

    const handler = (ping) => {
      callbackRef.current(ping);
    };

    socket.on("incoming-ping", handler);

    return () => {
      socket.off("incoming-ping", handler);
    };
  }, []);

  return socket;
}
