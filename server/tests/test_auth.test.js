/**
 * test_auth.test.js — registration, login, and JWT-based RBAC.
 * Backed by the in-memory MongoDB started in globalSetup.
 */

const request = require("supertest");
const { createApp } = require("../app");
const testEnv = require("./testEnv");

function buildApp() {
  const fakeRobot = {
    getStatus: async () => ({ id: "XR-900", position: { x: 0, y: 0 }, battery: 100, status: "IDLE" }),
    getMap: async () => ({ width: 21, height: 21, grid: [] }),
    move: async (x, y) => ({ success: true, message: `Navigating to (${x}, ${y})`, statusCode: 200 }),
    reset: async () => ({ success: true, message: "Simulation reset." }),
  };
  return createApp({ robotClient: fakeRobot });
}

beforeAll(testEnv.connect);
afterAll(testEnv.disconnect);
beforeEach(testEnv.clear);

test("POST /api/register creates a viewer by default and returns a token", async () => {
  const app = buildApp();
  const res = await request(app)
    .post("/api/register")
    .send({ username: "alice", password: "secret123" });

  expect(res.status).toBe(201);
  expect(res.body.username).toBe("alice");
  expect(res.body.role).toBe("viewer");
  expect(typeof res.body.token).toBe("string");
});

test("POST /api/register rejects short passwords", async () => {
  const app = buildApp();
  const res = await request(app)
    .post("/api/register")
    .send({ username: "alice", password: "123" });
  expect(res.status).toBe(400);
});

test("POST /api/register rejects duplicate usernames", async () => {
  const app = buildApp();
  await request(app).post("/api/register").send({ username: "alice", password: "secret123" });
  const dup = await request(app).post("/api/register").send({ username: "alice", password: "secret123" });
  expect(dup.status).toBe(400);
});

test("POST /api/login returns a token for valid credentials", async () => {
  const app = buildApp();
  await request(app).post("/api/register").send({ username: "alice", password: "secret123", role: "operator" });

  const res = await request(app).post("/api/login").send({ username: "alice", password: "secret123" });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
  expect(res.body.role).toBe("operator");
});

test("POST /api/login rejects wrong password", async () => {
  const app = buildApp();
  await request(app).post("/api/register").send({ username: "alice", password: "secret123" });
  const res = await request(app).post("/api/login").send({ username: "alice", password: "wrong" });
  expect(res.status).toBe(401);
});

test("JWT issued at login is accepted by /api/status", async () => {
  const app = buildApp();
  await request(app).post("/api/register").send({ username: "alice", password: "secret123" });
  const login = await request(app).post("/api/login").send({ username: "alice", password: "secret123" });

  const status = await request(app)
    .get("/api/status")
    .set("Authorization", `Bearer ${login.body.token}`);
  expect(status.status).toBe(200);
});

test("Viewer JWT is rejected by /api/move with 403", async () => {
  const app = buildApp();
  await request(app).post("/api/register").send({ username: "alice", password: "secret123", role: "viewer" });
  const login = await request(app).post("/api/login").send({ username: "alice", password: "secret123" });

  const res = await request(app)
    .post("/api/move")
    .set("Authorization", `Bearer ${login.body.token}`)
    .send({ x: 5, y: 5 });
  expect(res.status).toBe(403);
});

test("Operator JWT is accepted by /api/move", async () => {
  const app = buildApp();
  await request(app).post("/api/register").send({ username: "alice", password: "secret123", role: "operator" });
  const login = await request(app).post("/api/login").send({ username: "alice", password: "secret123" });

  const res = await request(app)
    .post("/api/move")
    .set("Authorization", `Bearer ${login.body.token}`)
    .send({ x: 5, y: 5 });
  expect(res.status).toBe(200);
});
