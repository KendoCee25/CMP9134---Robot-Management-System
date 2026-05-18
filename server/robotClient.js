/**
 * robotClient.js — Robot API Client
 *
 * Design Patterns applied:
 *   Singleton: Only one instance of RobotClient exists across the process.
 *              Achieved via the static `getInstance` slot and Node's module cache.
 *
 *   Facade:    Hides HTTP headers, JSON parsing, timeouts, retry/backoff, and
 *              error mapping behind clean intention-revealing methods
 *              (`getStatus`, `move`, `reset`, `getMap`). Route handlers never
 *              construct raw HTTP requests themselves.
 *
 *   Observer:  RobotClient extends EventEmitter. Subscribers (e.g. the WS relay)
 *              listen for connection-state transitions ("connected",
 *              "reconnecting", "disconnected") without polling the client.
 *
 * CMP9134 Software Engineering | University of Lincoln
 */

const EventEmitter = require("events");
const axios = require("axios");

const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_RETRIES = 3;
const BACKOFF_BASE_MS = 250;
const BACKOFF_CAP_MS = 4000;

class RobotClient extends EventEmitter {
  /**
   * Private-by-convention constructor.
   * Do NOT call new RobotClient() directly — use RobotClient.getInstance().
   */
  constructor(baseUrl = "http://robot:5000") {
    super();
    if (RobotClient._instance) {
      throw new Error(
        "RobotClient is a Singleton. Use RobotClient.getInstance() instead of new RobotClient()."
      );
    }
    this._baseUrl = baseUrl.replace(/\/$/, "");
    this._timeout = DEFAULT_TIMEOUT_MS;
    this._retries = DEFAULT_RETRIES;
    this._backoffBaseMs = BACKOFF_BASE_MS;
    this._backoffCapMs = BACKOFF_CAP_MS;
    this._state = "unknown"; // "connected" | "reconnecting" | "disconnected" | "unknown"
  }

  // ------------------------------------------------------------------ //
  // Singleton machinery                                                  //
  // ------------------------------------------------------------------ //

  static getInstance(baseUrl = "http://robot:5000") {
    if (!RobotClient._instance) {
      RobotClient._instance = new RobotClient(baseUrl);
    }
    return RobotClient._instance;
  }

  get baseUrl() { return this._baseUrl; }
  get connectionState() { return this._state; }

  // ------------------------------------------------------------------ //
  // Connection-state Observer                                            //
  // ------------------------------------------------------------------ //

  _transition(next) {
    if (this._state === next) return;
    const prev = this._state;
    this._state = next;
    this.emit("state", { from: prev, to: next });
    this.emit(next);
  }

  // ------------------------------------------------------------------ //
  // Internal: HTTP with exponential backoff                              //
  // ------------------------------------------------------------------ //

  /**
   * Run an HTTP request with exponential backoff.
   * Retries 5xx / network errors / timeouts. Does NOT retry 4xx — these are
   * validation failures and retrying them would just spam the robot.
   */
  async _withRetry(operation, attempts = this._retries) {
    let lastErr;
    for (let attempt = 0; attempt <= attempts; attempt++) {
      try {
        const result = await operation();
        this._transition("connected");
        return result;
      } catch (err) {
        lastErr = err;
        const status = err?.response?.status;
        // 4xx (except 429) → don't retry.
        if (status && status >= 400 && status < 500 && status !== 429) {
          this._transition("connected"); // robot is up, we just sent bad data
          throw err;
        }
        if (attempt === attempts) break;
        this._transition("reconnecting");
        const delay = Math.min(this._backoffCapMs, this._backoffBaseMs * 2 ** attempt);
        await new Promise((r) => setTimeout(r, delay));
      }
    }
    this._transition("disconnected");
    throw lastErr;
  }

  // ------------------------------------------------------------------ //
  // Facade methods                                                       //
  // ------------------------------------------------------------------ //

  async getStatus() {
    try {
      const res = await this._withRetry(() =>
        axios.get(`${this._baseUrl}/api/status`, { timeout: this._timeout }),
      );
      return res.data;
    } catch (err) {
      return { error: err.message, status: "UNREACHABLE" };
    }
  }

  async getMap() {
    try {
      const res = await this._withRetry(() =>
        axios.get(`${this._baseUrl}/api/map`, { timeout: this._timeout }),
      );
      return res.data;
    } catch (err) {
      return { error: err.message };
    }
  }

  async move(x, y) {
    try {
      const res = await this._withRetry(() =>
        axios.post(
          `${this._baseUrl}/api/move`,
          { x, y },
          { timeout: this._timeout },
        ),
      );
      return {
        success: true,
        message: `Navigating to (${x}, ${y})`,
        statusCode: res.status,
      };
    } catch (err) {
      const statusCode = err.response ? err.response.status : 503;
      return { success: false, message: err.message, statusCode };
    }
  }

  async reset() {
    try {
      await this._withRetry(() =>
        axios.post(`${this._baseUrl}/api/reset`, null, { timeout: this._timeout }),
      );
      return { success: true, message: "Simulation reset." };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
}

RobotClient._instance = null;

/** Test-only: clear the singleton so tests can install fakes. */
RobotClient._resetForTests = function () {
  RobotClient._instance = null;
};

module.exports = RobotClient;
