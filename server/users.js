/**
 * users.js — Mongo-backed user store.
 *
 * Design-pattern notes:
 *   - Factory: `createUser` is a small factory that hashes the password and
 *     persists the canonical user document (also enforces uniqueness).
 *
 * The exported surface is identical to the previous in-memory store so app.js
 * and the auth routes did not need to change.
 */

const bcrypt = require("bcryptjs");
const User = require("./models/User");
const { ROLES } = require("./validation");

const SALT_ROUNDS = 10;

async function createUser({ username, password, role }) {
  if (!username || typeof username !== "string") throw new Error("username is required");
  if (!password || typeof password !== "string" || password.length < 6) {
    throw new Error("password must be at least 6 characters");
  }
  const validRoles = Object.values(ROLES);
  if (!validRoles.includes(role)) throw new Error(`role must be one of ${validRoles.join(", ")}`);

  const existing = await User.findOne({ username }).lean();
  if (existing) throw new Error("username already taken");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ username, passwordHash, role });
  return { username: user.username, role: user.role };
}

async function verifyCredentials(username, password) {
  const user = await User.findOne({ username });
  if (!user) return null;
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return null;
  return { username: user.username, role: user.role };
}

async function findUser(username) {
  const user = await User.findOne({ username }).lean();
  if (!user) return null;
  return { username: user.username, role: user.role };
}

/** Test helper — wipe the users collection between tests. */
async function _reset() {
  await User.deleteMany({});
}

module.exports = { createUser, verifyCredentials, findUser, _reset };
