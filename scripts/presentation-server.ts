type ClientData = {
  sessionId: string;
  senderId: string;
};

const rooms = new Map<string, Set<ServerWebSocket<ClientData>>>();

function sanitizeSessionId(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 48);

  return normalized || "default";
}

function roomFor(sessionId: string) {
  const existing = rooms.get(sessionId);
  if (existing) return existing;

  const created = new Set<ServerWebSocket<ClientData>>();
  rooms.set(sessionId, created);
  return created;
}

function removeFromRoom(ws: ServerWebSocket<ClientData>) {
  const room = rooms.get(ws.data.sessionId);
  if (!room) return;

  room.delete(ws);
  if (room.size === 0) rooms.delete(ws.data.sessionId);
}

const port = Number(process.env.PRESENTATION_WS_PORT ?? 4860);
const hostname = process.env.PRESENTATION_WS_HOST ?? "0.0.0.0";

Bun.serve<ClientData>({
  hostname,
  port,
  fetch(req, server) {
    const url = new URL(req.url);

    if (url.pathname === "/healthz") return new Response("ok");

    if (url.pathname !== "/ws") return new Response("slide-react presentation relay ready");

    const sessionId = sanitizeSessionId(url.searchParams.get("session") ?? "default");
    const senderId = url.searchParams.get("sender") ?? "anonymous";
    const upgraded = server.upgrade(req, {
      data: {
        sessionId,
        senderId,
      },
    });

    if (upgraded) return;

    return new Response("websocket upgrade failed", { status: 400 });
  },
  websocket: {
    open(ws) {
      const room = roomFor(ws.data.sessionId);
      room.add(ws);
    },
    message(ws, message) {
      const room = rooms.get(ws.data.sessionId);
      if (!room) return;

      for (const peer of room) {
        if (peer === ws) continue;

        peer.send(message);
      }
    },
    close(ws) {
      removeFromRoom(ws);
    },
  },
});

console.log(`[slide-react] presentation relay listening on ws://${hostname}:${port}/ws`);
