/**
 * test_audit.test.js — every robot command is recorded in the audit log.
 *
 * Safety requirement: the brief states that *every* command sent to the robot
 * (timestamp, user, command type) must be persisted for safety auditing.
 *
 * Backed by the in-memory MongoDB started in globalSetup.
 */

const request = require("supertest");
const { createApp } = require("../app");
const audit = require("../auditLog");
const testEnv = require("./testEnv");

function buildApp() {
  const fakeRobot = {
    getStatus: async () => ({ id: "XR-900", position: { x: 0, y: 0 }, battery: 87, status: "IDLE" }),
    getMap: async () => ({ width: 21, height: 21, grid: [] }),
    move: async (x, y) => ({ success: true, message: `Navigating to (${x}, ${y})`, statusCode: 200 }),
    reset: async () => ({ success: true, message: "Simulation reset." }),
  };
  return createApp({ robotClient: fakeRobot });
}

beforeAll(testEnv.connect);
afterAll(testEnv.disconnect);
beforeEach(testEnv.clear);

test("Successful move appends a SUCCESS audit entry with a robot status snapshot", async () => {
  const app = buildApp();
  await request(app)
    .post("/api/move")
    .set("Authorization", "Bearer operator-token")
    .send({ x: 5, y: 7 });

  const list = await audit.listEntries();
  expect(list).toHaveLength(1);
  expect(list[0].command).toBe("MOVE");
  expect(list[0].outcome).toBe("SUCCESS");
  expect(list[0].target).toEqual({ x: 5, y: 7 });
  expect(list[0].role).toBe("operator");
  // Robot status data captured alongside the command (brief: safety auditing).
  expect(list[0].robotStatus).toBe("IDLE");
  expect(list[0].robotPosition).toEqual({ x: 0, y: 0 });
  expect(list[0].robotBattery).toBe(87);
});

test("Invalid move appends an ERROR audit entry", async () => {
  const app = buildApp();
  await request(app)
    .post("/api/move")
    .set("Authorization", "Bearer operator-token")
    .send({ x: 99, y: 0 });

  const list = await audit.listEntries();
  expect(list).toHaveLength(1);
  expect(list[0].outcome).toBe("ERROR");
  expect(list[0].detail).toMatch(/invalid/i);
});

test("Reset is also audited", async () => {
  const app = buildApp();
  await request(app)
    .post("/api/reset")
    .set("Authorization", "Bearer operator-token");

  const list = await audit.listEntries();
  expect(list).toHaveLength(1);
  expect(list[0].command).toBe("RESET");
  expect(list[0].outcome).toBe("SUCCESS");
});

test("Move without auth header is rejected and not logged", async () => {
  const app = buildApp();
  await request(app)
    .post("/api/move")
    .send({ x: 5, y: 5 }); // no Authorization header → 401

  expect(await audit.listEntries()).toHaveLength(0);
});

test("GET /api/audit returns the persisted log", async () => {
  const app = buildApp();
  await request(app)
    .post("/api/move")
    .set("Authorization", "Bearer operator-token")
    .send({ x: 3, y: 3 });

  const res = await request(app)
    .get("/api/audit")
    .set("Authorization", "Bearer viewer-token");
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body)).toBe(true);
  expect(res.body[0].command).toBe("MOVE");
});
