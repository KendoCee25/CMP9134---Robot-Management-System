/**
 * db.js — Mongoose connection helper.
 *
 * Keeps the connect/disconnect mechanics out of server.js and out of the
 * Express factory so tests can swap in an in-memory MongoDB
 * (mongodb-memory-server) via its own URL.
 */

const mongoose = require("mongoose");

const DEFAULT_URL = "mongodb://localhost:27017/robot-gcs";

async function connect(url = process.env.MONGO_URL || DEFAULT_URL) {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  await mongoose.connect(url, {
    serverSelectionTimeoutMS: 8000,
  });
  return mongoose.connection;
}

async function disconnect() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = { connect, disconnect, mongoose, DEFAULT_URL };
