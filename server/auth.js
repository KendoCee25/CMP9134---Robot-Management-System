/**
 * auth.js — authentication & RBAC middleware.
 *
 * Token strategy:
 *   1. Real users authenticate via signed JWT (HS256) issued by /api/login.
 *      Payload: { sub: <username>, role: "viewer" | "operator" }.
 *   2. Two static demo tokens ("viewer-token", "operator-token") remain
 *      supported so the existing unit tests and quick curl checks keep working
 *      without spinning up a real account.
 *
 * The static-token map is kept tiny and read-only; production deployments
 * should rotate JWT_SECRET and disable the static tokens (set DISABLE_STATIC_TOKENS=1).
 */

const jwt = require("jsonwebtoken");
const { ROLES, canCommandRobot } = require("./validation");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const JWT_TTL = process.env.JWT_TTL || "12h";

const STATIC_TOKENS = {
  "viewer-token": { username: "viewer-static", role: ROLES.VIEWER },
  "operator-token": { username: "operator-static", role: ROLES.OPERATOR },
};

function signToken(user) {
  return jwt.sign({ sub: user.username, role: user.role }, JWT_SECRET, { expiresIn: JWT_TTL });
}

function verifyToken(token) {
  if (!token) return null;
  if (!process.env.DISABLE_STATIC_TOKENS && STATIC_TOKENS[token]) {
    return STATIC_TOKENS[token];
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (!payload?.sub || !payload?.role) return null;
    return { username: payload.sub, role: payload.role };
  } catch {
    return null;
  }
}

function extractToken(req) {
  const header = req.headers["authorization"] || "";
  const match = header.match(/^Bearer\s+(.+)$/);
  if (match) return match[1];
  // WS upgrade path uses query string: /ws/telemetry?token=...
  if (req.url && req.url.includes("token=")) {
    const url = new URL(req.url, "http://localhost");
    return url.searchParams.get("token");
  }
  return null;
}

function authenticate(req, res, next) {
  const token = extractToken(req);
  if (!token) return res.status(401).json({ error: "Missing or malformed token." });
  const user = verifyToken(token);
  if (!user) return res.status(401).json({ error: "Invalid or expired token." });
  req.user = user;
  next();
}

function requireOperator(req, res, next) {
  if (!req.user || !canCommandRobot(req.user.role)) {
    return res.status(403).json({ error: "Operator role required." });
  }
  next();
}

module.exports = {
  authenticate,
  requireOperator,
  signToken,
  verifyToken,
  extractToken,
  STATIC_TOKENS,
  JWT_SECRET,
};
