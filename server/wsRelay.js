/**
 * wsRelay.js — WebSocket relay for the GCS dashboard.
 *
 * Architecture:
 *   Dashboard (browser)
 *        │  ws://gcs/ws/telemetry?token=…
 *        ▼
 *   Express + ws.Server (this module)        ← authenticates clients (JWT)
 *        │  ws://robot:5000/ws/telemetry     ← single upstream connection
 *        ▼
 *   Virtual Robot
 *
 * One upstream WebSocket to the robot is shared by all browser subscribers
 * (publish-subscribe / Observer). When the upstream drops, we reconnect with
 * exponential backoff and broadcast a status frame so clients can show
 * "Reconnecting…" / "Signal Lost".
 */

const WebSocket = require("ws");
const { verifyToken } = require("./auth");

const UPSTREAM_BACKOFF_BASE = 1000;
const UPSTREAM_BACKOFF_CAP = 15_000;

function attach({ server, robotUrl }) {
  const wsServer = new WebSocket.Server({ noServer: true });
  const subscribers = new Set();
  let upstream = null;
  let upstreamAttempt = 0;
  let reconnectTimer = null;
  let stopped = false;

  function broadcast(payload) {
    const json = typeof payload === "string" ? payload : JSON.stringify(payload);
    for (const client of subscribers) {
      if (client.readyState === WebSocket.OPEN) {
        try { client.send(json); } catch { /* ignore */ }
      }
    }
  }

  function connectUpstream() {
    if (stopped) return;
    const url = robotUrl.replace(/^http/, "ws") + "/ws/telemetry";
    try {
      upstream = new WebSocket(url);
    } catch (err) {
      scheduleUpstreamRetry();
      return;
    }

    upstream.on("open", () => {
      upstreamAttempt = 0;
      broadcast({ _type: "connection", state: "connected" });
    });
    upstream.on("message", (data) => {
      // Pass through verbatim — frames already match /api/status shape.
      broadcast(data.toString());
    });
    upstream.on("close", () => {
      broadcast({ _type: "connection", state: "reconnecting" });
      scheduleUpstreamRetry();
    });
    upstream.on("error", () => {
      // Swallow — close handler will run.
    });
  }

  function scheduleUpstreamRetry() {
    if (stopped || reconnectTimer) return;
    const delay = Math.min(
      UPSTREAM_BACKOFF_CAP,
      UPSTREAM_BACKOFF_BASE * 2 ** upstreamAttempt,
    );
    upstreamAttempt += 1;
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connectUpstream();
    }, delay);
  }

  // HTTP -> WebSocket upgrade with JWT check.
  server.on("upgrade", (req, socket, head) => {
    if (!req.url || !req.url.startsWith("/ws/telemetry")) return;
    const user = verifyToken(new URL(req.url, "http://localhost").searchParams.get("token"));
    if (!user) {
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    wsServer.handleUpgrade(req, socket, head, (ws) => {
      ws.user = user;
      wsServer.emit("connection", ws, req);
    });
  });

  wsServer.on("connection", (client) => {
    subscribers.add(client);
    client.on("close", () => subscribers.delete(client));
  });

  connectUpstream();

  return {
    close() {
      stopped = true;
      if (reconnectTimer) { clearTimeout(reconnectTimer); reconnectTimer = null; }
      if (upstream) { try { upstream.close(); } catch { /* ignore */ } upstream = null; }
      for (const c of subscribers) { try { c.close(); } catch { /* ignore */ } }
      subscribers.clear();
      wsServer.close();
    },
  };
}

module.exports = { attach };
