/**
 * test_robotClient.test.js — retry/backoff and Observer emission.
 *
 * Mocks axios so the test never touches the network. Backoff is reduced to 1ms
 * via the instance knobs so the suite stays fast.
 */

jest.mock("axios");
const axios = require("axios");
const RobotClient = require("../robotClient");

function newClient() {
  RobotClient._resetForTests();
  const c = RobotClient.getInstance("http://robot:5000");
  c._backoffBaseMs = 1;
  c._backoffCapMs = 1;
  return c;
}

beforeEach(() => {
  jest.clearAllMocks();
});

function fakeOk(data, status = 200) {
  return Promise.resolve({ status, data });
}
function fakeNetErr(msg = "ECONNREFUSED") {
  return Promise.reject(new Error(msg));
}
function fakeServerErr(status = 503) {
  const err = new Error(`HTTP ${status}`);
  err.response = { status };
  return Promise.reject(err);
}

test("getStatus succeeds on first try without retrying", async () => {
  axios.get.mockImplementationOnce(() =>
    fakeOk({ id: "XR-900", status: "IDLE", position: { x: 0, y: 0 }, battery: 100 }),
  );
  const client = newClient();
  client._retries = 3;
  const events = [];
  client.on("state", (e) => events.push(e.to));

  const result = await client.getStatus();

  expect(result.status).toBe("IDLE");
  expect(axios.get).toHaveBeenCalledTimes(1);
  expect(events).toContain("connected");
});

test("getStatus retries on 5xx then succeeds, emitting reconnecting then connected", async () => {
  axios.get
    .mockImplementationOnce(() => fakeServerErr(503))
    .mockImplementationOnce(() => fakeServerErr(503))
    .mockImplementationOnce(() => fakeOk({ status: "IDLE" }));

  const client = newClient();
  client._retries = 3;
  const events = [];
  client.on("state", (e) => events.push(e.to));

  const result = await client.getStatus();

  expect(result.status).toBe("IDLE");
  expect(axios.get).toHaveBeenCalledTimes(3);
  expect(events).toEqual(expect.arrayContaining(["reconnecting", "connected"]));
});

test("getStatus surfaces UNREACHABLE after all retries are exhausted, emitting disconnected", async () => {
  axios.get.mockImplementation(() => fakeNetErr("ECONNREFUSED"));

  const client = newClient();
  client._retries = 2;
  const events = [];
  client.on("state", (e) => events.push(e.to));

  const result = await client.getStatus();

  expect(result.status).toBe("UNREACHABLE");
  expect(axios.get).toHaveBeenCalledTimes(3); // initial + 2 retries
  expect(events).toEqual(expect.arrayContaining(["reconnecting", "disconnected"]));
});

test("move does NOT retry on 4xx — robot is up, request was bad", async () => {
  axios.post.mockImplementationOnce(() => {
    const err = new Error("HTTP 422");
    err.response = { status: 422 };
    return Promise.reject(err);
  });

  const client = newClient();
  client._retries = 5;

  const result = await client.move(5, 5);

  expect(result.success).toBe(false);
  expect(result.statusCode).toBe(422);
  expect(axios.post).toHaveBeenCalledTimes(1);
});

test("RobotClient is a Singleton", () => {
  RobotClient._resetForTests();
  const a = RobotClient.getInstance("http://robot:5000");
  const b = RobotClient.getInstance("http://different:5000");
  expect(a).toBe(b);
  expect(() => new RobotClient()).toThrow(/Singleton/);
});
