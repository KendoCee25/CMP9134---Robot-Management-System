/**
 * Jest globalTeardown — stops the shared MongoMemoryServer started in
 * globalSetup.js.
 */

module.exports = async function globalTeardown() {
  if (globalThis.__MONGOD__) {
    await globalThis.__MONGOD__.stop();
  }
};
