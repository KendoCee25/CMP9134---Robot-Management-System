/**
 * app.js — Express application factory.
 *
 * Exported as a factory so tests can inject a fake RobotClient. The production
 * entrypoint (server.js) builds the real one and attaches the WS relay.
 *
 * Endpoints:
 *   POST /api/register   public  → create a new user
 *   POST /api/login      public  → exchange credentials for a JWT
 *   GET  /api/status     auth    → live telemetry (proxied)
 *   GET  /api/map        auth    → 21×21 grid map (proxied)
 *   POST /api/move       auth+op → send navigation command (audited)
 *   POST /api/reset      auth+op → reset simulation (audited)
 *   GET  /api/audit      auth    → list audit entries
 */

const express = require("express");
const RobotClient = require("./robotClient");
const { isValidTarget } = require("./validation");
const { authenticate, requireOperator } = require("./auth");
const audit = require("./auditLog");
const authRoutes = require("./routes/auth");

function createApp({ robotClient } = {}) {
  const app = express();
  app.use(express.json());

  const robot =
    robotClient ||
    RobotClient.getInstance(process.env.ROBOT_URL || "http://robot:5000");

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.use("/api", authRoutes);

  app.get("/api/status", authenticate, async (_req, res) => {
    const status = await robot.getStatus();
    res.json(status);
  });

  app.get("/api/map", authenticate, async (_req, res) => {
    const map = await robot.getMap();
    if (map?.error) return res.status(503).json(map);
    res.json(map);
  });

  // Snapshot the robot's current state for the audit trail. Returns `{}` on
  // failure — auditing must never block the user's command.
  async function snapshot() {
    try {
      const s = await robot.getStatus();
      if (!s || s.status === "UNREACHABLE") return { robotStatus: "UNREACHABLE" };
      return {
        robotStatus: s.status,
        robotPosition: s.position,
        robotBattery: s.battery,
      };
    } catch {
      return { robotStatus: "UNREACHABLE" };
    }
  }

  app.post("/api/move", authenticate, requireOperator, async (req, res) => {
    const { x, y } = req.body || {};
    const snap = await snapshot();
    if (!isValidTarget(x, y)) {
      await audit.recordEntry({
        username: req.user.username || req.user.role,
        role: req.user.role,
        command: "MOVE",
        target: typeof x === "number" && typeof y === "number" ? { x, y } : null,
        outcome: "ERROR",
        detail: "Invalid coordinates",
        ...snap,
      });
      return res.status(422).json({ error: "Invalid coordinates." });
    }
    const result = await robot.move(x, y);
    await audit.recordEntry({
      username: req.user.username || req.user.role,
      role: req.user.role,
      command: "MOVE",
      target: { x, y },
      outcome: result.success ? "SUCCESS" : "ERROR",
      detail: result.success ? null : result.message,
      ...snap,
    });
    res.status(result.statusCode || 200).json(result);
  });

  app.post("/api/reset", authenticate, requireOperator, async (req, res) => {
    const snap = await snapshot();
    const result = await robot.reset();
    await audit.recordEntry({
      username: req.user.username || req.user.role,
      role: req.user.role,
      command: "RESET",
      target: null,
      outcome: result.success ? "SUCCESS" : "ERROR",
      detail: result.success ? null : result.message,
      ...snap,
    });
    res.status(result.success ? 200 : 503).json(result);
  });

  app.get("/api/audit", authenticate, async (_req, res) => {
    res.json(await audit.listEntries());
  });

  return app;
}

module.exports = { createApp };
