/**
 * Jest globalSetup — boots a single in-memory MongoDB for the whole suite.
 *
 * The URI is exported on process.env so worker processes pick it up;
 * the MongoMemoryServer instance is stashed on globalThis for the
 * companion globalTeardown to stop.
 */

const { MongoMemoryServer } = require("mongodb-memory-server");

module.exports = async function globalSetup() {
  const mongod = await MongoMemoryServer.create();
  globalThis.__MONGOD__ = mongod;
  process.env.MONGO_URL_TEST = mongod.getUri();
};
