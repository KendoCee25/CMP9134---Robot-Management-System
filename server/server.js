/**
 * server.js — production entry point.
 *
 * 1. Connect to MongoDB.
 * 2. Build the Express app (factory in app.js).
 * 3. Wrap it in an HTTP server and attach the WebSocket relay.
 * 4. Start listening.
 *
 * The split between app.js (testable factory) and server.js (process
 * bootstrap) keeps tests fast — they never bind a port and never reach Mongo
 * unless they want to.
 */

const http = require("http");
const { createApp } = require("./app");
const wsRelay = require("./wsRelay");
const db = require("./db");

const PORT = process.env.PORT || 5000;
const ROBOT_URL = process.env.ROBOT_URL || "http://robot:5000";

async function main() {
  await db.connect();
  // eslint-disable-next-line no-console
  console.log(`Mongo connected (${process.env.MONGO_URL || db.DEFAULT_URL})`);

  const app = createApp();
  const server = http.createServer(app);
  wsRelay.attach({ server, robotUrl: ROBOT_URL });

  server.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Robot GCS backend listening on :${PORT} (robot=${ROBOT_URL})`);
  });
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error("Fatal startup error:", err);
  process.exit(1);
});
