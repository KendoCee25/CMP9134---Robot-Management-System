/**
 * testEnv — per-file helpers to connect to the shared in-memory MongoDB
 * (booted by globalSetup) and wipe state between tests.
 */

const db = require("../db");

async function connect() {
  await db.connect(process.env.MONGO_URL_TEST);
}

async function disconnect() {
  await db.disconnect();
}

async function clear() {
  const { mongoose } = db;
  const collections = await mongoose.connection.db.collections();
  for (const c of collections) await c.deleteMany({});
}

module.exports = { connect, disconnect, clear };
