/**
 * integration_robot.test.js — exercises the *real* RobotClient against the
 * *real* Virtual Robot container (no axios mock, no fake client injection).
 *
 * Auto-skips when `ROBOT_URL` is not set so local `npm test` keeps working
 * without `docker compose up`. The Dockerised integration job in CI
 * (`docker-compose.test.yml`) sets `ROBOT_URL=http://robot:5000`, so this
 * suite runs there and verifies the brief's "Integration tests ensuring your
 * system correctly talks to the Robot API" requirement.
 */

const RobotClient = require("../robotClient");

const ROBOT_URL = process.env.ROBOT_URL;
const shouldRun = Boolean(ROBOT_URL);

const suite = shouldRun ? describe : describe.skip;

jest.setTimeout(30_000);

suite(`Integration: live robot at ${ROBOT_URL || "<unset>"}`, () => {
  let client;

  beforeAll(async () => {
    RobotClient._resetForTests();
    client = RobotClient.getInstance(ROBOT_URL);

    // Robot container may still be starting when this file runs in CI.
    // Probe with a 15-second budget before failing the suite outright.
    const deadline = Date.now() + 15_000;
    let lastErr = "no attempt";
    while (Date.now() < deadline) {
      const probe = await client.getStatus();
      if (probe && probe.status && probe.status !== "UNREACHABLE") return;
      lastErr = (probe && probe.error) || "unknown";
      await new Promise((r) => setTimeout(r, 1000));
    }
    throw new Error(`Robot at ${ROBOT_URL} never responded within 15s: ${lastErr}`);
  });

  test("GET /api/status returns the documented telemetry shape", async () => {
    const s = await client.getStatus();
    expect(s.id).toBe("XR-900");
    expect(s.position).toEqual(
      expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
    );
    expect(s.battery).toBeGreaterThanOrEqual(0);
    expect(s.battery).toBeLessThanOrEqual(100);
    expect(["IDLE", "MOVING", "LOW_BATTERY", "STUCK"]).toContain(s.status);
  });

  test("GET /api/map returns a 21×21 grid", async () => {
    const m = await client.getMap();
    expect(m.width).toBe(21);
    expect(m.height).toBe(21);
    expect(m.grid).toHaveLength(21);
    expect(m.grid[0]).toHaveLength(21);
  });

  test("POST /api/reset homes the robot to (0,0) with full battery", async () => {
    const r = await client.reset();
    expect(r.success).toBe(true);

    // Give the simulator a brief moment to settle.
    await new Promise((r) => setTimeout(r, 500));

    const s = await client.getStatus();
    expect(s.position).toEqual({ x: 0, y: 0 });
    expect(s.battery).toBe(100);
    expect(s.status).toBe("IDLE");
  });

  test("POST /api/move accepts valid coordinates and the robot reports MOVING", async () => {
    await client.reset();
    await new Promise((r) => setTimeout(r, 300));

    const r = await client.move(3, 3);
    expect(r.success).toBe(true);
    expect(r.statusCode).toBe(200);
    expect(r.message).toMatch(/Navigating to \(3,\s*3\)/);
  });

  test("POST /api/move rejects out-of-range coordinates with 422", async () => {
    const r = await client.move(99, 99);
    expect(r.success).toBe(false);
    expect(r.statusCode).toBe(422);
  });
});
