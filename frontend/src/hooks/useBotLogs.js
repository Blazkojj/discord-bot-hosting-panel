import { startTransition, useEffect, useState } from "react";
import { createLogSocket } from "../lib/socket";
import { api } from "../lib/api";

function appendEntries(currentEntries, incomingEntries) {
  const nextEntries = [...currentEntries, ...incomingEntries].slice(-400);
  return nextEntries;
}

export function useBotLogs(botId, token) {
  const [entries, setEntries] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!botId || !token) {
      return undefined;
    }

    let active = true;
    const socket = createLogSocket(token);

    api
      .get(`/bots/${botId}/logs?lines=150`, token)
      .then((data) => {
        if (active) {
          startTransition(() => {
            setEntries(data.entries || []);
          });
        }
      })
      .catch(() => null);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("logs:subscribe", { botId });
    });

    socket.on("disconnect", () => {
      setConnected(false);
    });

    socket.on("logs:init", (payload) => {
      startTransition(() => {
        setEntries(payload.entries || []);
      });
    });

    socket.on("logs:chunk", (entry) => {
      const chunks = String(entry.message || "")
        .split(/\r?\n/)
        .filter(Boolean)
        .map((message) => ({
          source: entry.source || "stdout",
          message
        }));

      startTransition(() => {
        setEntries((current) => appendEntries(current, chunks));
      });
    });

    socket.on("logs:error", (payload) => {
      setError(payload.message || "Wystąpił błąd połączenia z kanałem logów.");
    });

    socket.connect();

    return () => {
      active = false;
      socket.emit("logs:unsubscribe");
      socket.disconnect();
    };
  }, [botId, token]);

  return {
    entries,
    connected,
    error
  };
}
