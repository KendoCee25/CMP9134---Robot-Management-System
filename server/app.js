/**
 * app.js — Express application factory.
 *
 * Exported as a factory so tests can inject a fake RobotClient and
 * the production entrypoint (server.js) can build the real one.
 */

const express = require("express");
const RobotClient = require("./robotClient");
const { isValidTarget } = require("./validation");
const { authenticate, requireOperator } = require("./auth");

function createApp({ robotClient } = {}) {
  const app = express();
  app.use(express.json());

  const robot =
    robotClient ||
    RobotClient.getInstance(process.env.ROBOT_URL || "http://robot:5000");

  app.get("/api/status", authenticate, async (req, res) => {
    const status = await robot.getStatus();
    res.json(status);
  });

  app.post("/api/move", authenticate, requireOperator, async (req, res) => {
    const { x, y } = req.body || {};
    if (!isValidTarget(x, y)) {
      return res.status(422).json({ error: "Invalid coordinates." });
    }
    const result = await robot.move(x, y);
    res.status(result.statusCode || 200).json(result);
  });

  app.post("/api/reset", authenticate, requireOperator, async (req, res) => {
    const result = await robot.reset();
    res.status(result.success ? 200 : 503).json(result);
  });

  return app;
}

module.exports = { createApp };
