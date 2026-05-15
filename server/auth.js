/**
 * auth.js — minimal token-to-role middleware for the lab.
 *
 * The real system will use signed JWTs; for testing we accept simple
 * static tokens whose role is looked up in a map. This keeps RBAC
 * enforceable on the server without dragging in a JWT library.
 */

const { ROLES, canCommandRobot } = require("./validation");

const TOKEN_ROLES = {
  "viewer-token": ROLES.VIEWER,
  "operator-token": ROLES.OPERATOR,
};

function authenticate(req, res, next) {
  const header = req.headers["authorization"] || "";
  const match = header.match(/^Bearer\s+(.+)$/);
  if (!match) {
    return res.status(401).json({ error: "Missing or malformed token." });
  }
  const role = TOKEN_ROLES[match[1]];
  if (!role) {
    return res.status(401).json({ error: "Invalid token." });
  }
  req.user = { role };
  next();
}

function requireOperator(req, res, next) {
  if (!req.user || !canCommandRobot(req.user.role)) {
    return res.status(403).json({ error: "Operator role required." });
  }
  next();
}

module.exports = { authenticate, requireOperator, TOKEN_ROLES };
