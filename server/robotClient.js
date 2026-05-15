/**
 * robotClient.js — Robot API Client
 *
 * Design Patterns applied:
 *   Singleton: Only one instance of RobotClient can exist across the entire
 *              Express application. Achieved by caching the instance on the
 *              module itself — Node.js module caching guarantees this.
 *
 *   Facade:    Hides the messy details of HTTP headers, JSON parsing, timeouts,
 *              and error handling behind clean, intention-revealing methods
 *              (getStatus, move, reset). Route handlers never construct raw
 *              HTTP requests themselves.
 *
 * Week 5 — Lab Sheet 5: Architecture, Patterns & Reuse
 * CMP9134 Software Engineering | University of Lincoln
 */

const axios = require("axios");

class RobotClient {
  /**
   * Private-by-convention constructor.
   * Do NOT call new RobotClient() directly — use RobotClient.getInstance().
   *
   * @param {string} baseUrl - Base URL of the Virtual Robot API
   */
  constructor(baseUrl = "http://robot:5000") {
    if (RobotClient._instance) {
      throw new Error(
        "RobotClient is a Singleton. Use RobotClient.getInstance() instead of new RobotClient()."
      );
    }
    this._baseUrl = baseUrl.replace(/\/$/, ""); // strip trailing slash
    this._timeout = 5000; // ms — prevents hanging on an unresponsive robot
  }

  // ------------------------------------------------------------------ //
  // Singleton machinery                                                  //
  // ------------------------------------------------------------------ //

  /**
   * Return the single shared instance, creating it on the first call.
   *
   * @param {string} [baseUrl] - Only used on the first call; ignored afterwards.
   * @returns {RobotClient} The one-and-only RobotClient instance.
   */
  static getInstance(baseUrl = "http://robot:5000") {
    if (!RobotClient._instance) {
      RobotClient._instance = new RobotClient(baseUrl);
    }
    return RobotClient._instance;
  }

  // ------------------------------------------------------------------ //
  // Facade methods — public API exposed to Express route handlers        //
  // ------------------------------------------------------------------ //

  /**
   * Retrieve the robot's current telemetry.
   *
   * Facade responsibility: builds the correct URL, sends the GET request,
   * parses JSON, and maps errors to a consistent response shape.
   *
   * @returns {Promise<object>} Telemetry object, e.g.:
   *   { position: { x: 3, y: 7 }, battery: 82, status: "IDLE", timestamp: "..." }
   *   On failure: { error: "<reason>", status: "UNREACHABLE" }
   */
  async getStatus() {
    try {
      const res = await axios.get(`${this._baseUrl}/api/status`, {
        timeout: this._timeout,
      });
      return res.data;
    } catch (err) {
      return { error: err.message, status: "UNREACHABLE" };
    }
  }

  /**
   * Command the robot to navigate to grid coordinates (x, y).
   *
   * Facade responsibility: detects if the robot is reachable, constructs the
   * POST body, handles 422 (invalid coords) and 503 (robot stuck/unreachable),
   * and returns a normalised result object.
   *
   * @param {number} x - Target X coordinate (expected range 0–20)
   * @param {number} y - Target Y coordinate (expected range 0–20)
   * @returns {Promise<object>} e.g.:
   *   { success: true,  message: "Navigating to (5, 10)", statusCode: 200 }
   *   { success: false, message: "<reason>",              statusCode: 503 }
   */
  async move(x, y) {
    const reachable = await this._isResponsive();
    if (!reachable) {
      return { success: false, message: "Robot unreachable.", statusCode: 503 };
    }
    try {
      const res = await axios.post(
        `${this._baseUrl}/api/move`,
        { x, y },
        { timeout: this._timeout }
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

  /**
   * Reset the robot simulation to its initial state.
   *
   * Facade responsibility: sends POST /api/reset, handles timeouts gracefully,
   * and returns a normalised result object.
   *
   * @returns {Promise<object>} e.g.:
   *   { success: true,  message: "Simulation reset." }
   *   { success: false, message: "<reason>" }
   */
  async reset() {
    try {
      await axios.post(`${this._baseUrl}/api/reset`, null, {
        timeout: this._timeout,
      });
      return { success: true, message: "Simulation reset." };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  // ------------------------------------------------------------------ //
  // Internal helper — NOT part of the public Facade                     //
  // ------------------------------------------------------------------ //

  /**
   * Lightweight health-check before sending commands.
   * Attempts GET /api/status; returns true on HTTP 200, false otherwise.
   * Called internally by move() and reset() to detect the STUCK scenario.
   *
   * @returns {Promise<boolean>}
   * @private
   */
  async _isResponsive() {
    try {
      const res = await axios.get(`${this._baseUrl}/api/status`, {
        timeout: this._timeout,
      });
      return res.status === 200;
    } catch (err) {
      return false;
    }
  }
}

// Initialise the class-level Singleton slot
RobotClient._instance = null;

// Export a factory function so callers always go through getInstance()
module.exports = RobotClient;
