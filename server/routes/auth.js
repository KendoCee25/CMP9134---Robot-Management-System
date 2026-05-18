/**
 * routes/auth.js — registration and login endpoints.
 *
 * POST /api/register  { username, password, role } -> { token, username, role }
 * POST /api/login     { username, password }       -> { token, username, role }
 */

const express = require("express");
const { signToken } = require("../auth");
const users = require("../users");
const { ROLES } = require("../validation");

const router = express.Router();

router.post("/register", async (req, res) => {
  const { username, password, role } = req.body || {};
  try {
    const validRoles = Object.values(ROLES);
    const requestedRole = validRoles.includes(role) ? role : ROLES.VIEWER;
    const created = await users.createUser({ username, password, role: requestedRole });
    const token = signToken(created);
    res.status(201).json({ token, username: created.username, role: created.role });
  } catch (err) {
    res.status(400).json({ error: err.message || "Registration failed." });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: "username and password are required." });
  }
  const user = await users.verifyCredentials(username, password);
  if (!user) return res.status(401).json({ error: "Invalid username or password." });
  const token = signToken(user);
  res.json({ token, username: user.username, role: user.role });
});

module.exports = router;
