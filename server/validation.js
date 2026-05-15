/**
 * validation.js — pure input-validation helpers.
 * Kept side-effect free so they can be exercised by unit tests
 * without spinning up Express, MongoDB, or the robot.
 */

const GRID_MIN = 0;
const GRID_MAX = 20;

function isValidTarget(x, y) {
  if (typeof x !== "number" || typeof y !== "number") return false;
  if (Number.isNaN(x) || Number.isNaN(y)) return false;
  if (!Number.isInteger(x) || !Number.isInteger(y)) return false;
  if (x < GRID_MIN || x > GRID_MAX) return false;
  if (y < GRID_MIN || y > GRID_MAX) return false;
  return true;
}

const ROLES = Object.freeze({
  VIEWER: "viewer",
  OPERATOR: "operator",
});

function canCommandRobot(role) {
  return role === ROLES.OPERATOR;
}

module.exports = { isValidTarget, canCommandRobot, ROLES, GRID_MIN, GRID_MAX };
