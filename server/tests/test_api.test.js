/**
 * Task 2 — API integration tests.
 *
 * Uses supertest (Node equivalent of FastAPI's TestClient) to drive the
 * Express app in-process. A fake RobotClient is injected so the tests
 * never touch the real Virtual Robot container.
 */

const request = require("supertest");
const { createApp } = require("../app");

function buildApp() {
  const fakeRobot = {
    getStatus: async () => ({ position: { x: 0, y: 0 }, status: "IDLE" }),
    move: async (x, y) => ({
      success: true,
      message: `Navigating to (${x}, ${y})`,
      statusCode: 200,
    }),
    reset: async () => ({ success: true, message: "Simulation reset." }),
  };
  return createApp({ robotClient: fakeRobot });
}

test("POST /api/move without a token returns 401", async () => {
  const app = buildApp();

  const response = await request(app)
    .post("/api/move")
    .send({ x: 10, y: 10 });

  expect(response.status).toBe(401);
});

test("POST /api/move with a Viewer token returns 403", async () => {
  const app = buildApp();

  const response = await request(app)
    .post("/api/move")
    .set("Authorization", "Bearer viewer-token")
    .send({ x: 10, y: 10 });

  expect(response.status).toBe(403);
});

test("POST /api/move with an Operator token and valid coords returns 200", async () => {
  const app = buildApp();

  const response = await request(app)
    .post("/api/move")
    .set("Authorization", "Bearer operator-token")
    .send({ x: 5, y: 7 });

  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
});

test("POST /api/move with an Operator token but invalid coords returns 422", async () => {
  const app = buildApp();

  const response = await request(app)
    .post("/api/move")
    .set("Authorization", "Bearer operator-token")
    .send({ x: 999, y: -3 });

  expect(response.status).toBe(422);
  expect(response.body.error).toMatch(/invalid/i);
});
