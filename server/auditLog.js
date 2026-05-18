/**
 * auditLog.js — Mongo-backed immutable mission audit trail.
 *
 * Every robot command (move / reset) and its outcome is persisted here for
 * safety auditing as required by the brief. Documents are append-only — the
 * dashboard reads but never mutates them.
 *
 * Design-pattern notes:
 *   - Factory: `recordEntry` constructs the canonical entry shape.
 *
 * The exported surface is identical to the previous in-memory store; the
 * Express handler in app.js did not change.
 */

const MissionLog = require("./models/MissionLog");

const LIST_LIMIT = 500;

async function recordEntry({
  username,
  role,
  command,
  target,
  outcome,
  detail,
  robotStatus,
  robotPosition,
  robotBattery,
}) {
  const doc = await MissionLog.create({
    username,
    role,
    command,
    target: target || null,
    outcome,
    detail: detail || null,
    robotStatus: robotStatus || null,
    robotPosition: robotPosition || null,
    robotBattery: typeof robotBattery === "number" ? robotBattery : null,
  });
  return doc.toJSON();
}

async function listEntries({ limit = LIST_LIMIT } = {}) {
  const docs = await MissionLog.find().sort({ timestamp: -1 }).limit(limit);
  return docs.map((d) => d.toJSON());
}

/** Test helper — wipe the audit collection between tests. */
async function _reset() {
  await MissionLog.deleteMany({});
}

module.exports = { recordEntry, listEntries, _reset, LIST_LIMIT };
