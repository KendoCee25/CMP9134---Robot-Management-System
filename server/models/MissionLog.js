/**
 * models/MissionLog.js — immutable audit-trail document.
 *
 * Indexed on `timestamp` (desc) so the dashboard can paginate newest-first
 * over large logs without an in-memory sort.
 */

const mongoose = require("mongoose");

const missionLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: () => new Date(), index: true },
  username: { type: String, required: true },
  role: { type: String, required: true },
  command: { type: String, enum: ["MOVE", "RESET"], required: true },
  target: {
    type: { x: Number, y: Number },
    default: null,
    _id: false,
  },
  outcome: { type: String, enum: ["SUCCESS", "ERROR"], required: true },
  detail: { type: String, default: null },
  // Snapshot of the robot at the moment the command was issued — captured so
  // the audit trail records both the command and the robot status data
  // ("safety auditing" requirement in the brief).
  robotStatus: { type: String, default: null },
  robotPosition: { type: { x: Number, y: Number }, default: null, _id: false },
  robotBattery: { type: Number, default: null },
});

missionLogSchema.index({ timestamp: -1 });

missionLogSchema.set("toJSON", {
  transform(_doc, ret) {
    ret.id = String(ret._id);
    ret.timestamp = ret.timestamp instanceof Date ? ret.timestamp.toISOString() : ret.timestamp;
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("MissionLog", missionLogSchema);
