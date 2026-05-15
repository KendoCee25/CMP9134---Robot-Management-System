/**
 * Task 1 — Unit tests for pure helpers (validation.js).
 *
 * Mirrors the workshop's "Arrange / Act / Assert" pattern.
 * No database or network is touched: these are raw-logic checks.
 */

const {
  isValidTarget,
  canCommandRobot,
  ROLES,
  GRID_MIN,
  GRID_MAX,
} = require("../validation");

// --- the workshop's introductory example, adapted -------------------------

test("valid coordinates pass and out-of-range coordinates fail", () => {
  // Arrange
  const goodX = 10, goodY = 10;
  const badX = 150, badY = -10;

  // Act
  const resultGood = isValidTarget(goodX, goodY);
  const resultBad = isValidTarget(badX, badY);

  // Assert
  expect(resultGood).toBe(true);
  expect(resultBad).toBe(false);
});

// --- 6+ edge-case tests for actual implemented functionality --------------

test("lower-bound corner (0,0) is accepted", () => {
  expect(isValidTarget(GRID_MIN, GRID_MIN)).toBe(true);
});

test("upper-bound corner (20,20) is accepted", () => {
  expect(isValidTarget(GRID_MAX, GRID_MAX)).toBe(true);
});

test("just-past upper bound (21,0) is rejected", () => {
  expect(isValidTarget(GRID_MAX + 1, 0)).toBe(false);
});

test("non-integer coordinates are rejected", () => {
  expect(isValidTarget(3.5, 7)).toBe(false);
  expect(isValidTarget(2, 4.1)).toBe(false);
});

test("non-numeric inputs are rejected", () => {
  expect(isValidTarget("5", 5)).toBe(false);
  expect(isValidTarget(null, 5)).toBe(false);
  expect(isValidTarget(undefined, undefined)).toBe(false);
  expect(isValidTarget(NaN, 5)).toBe(false);
});

test("only the operator role can command the robot", () => {
  expect(canCommandRobot(ROLES.OPERATOR)).toBe(true);
  expect(canCommandRobot(ROLES.VIEWER)).toBe(false);
  expect(canCommandRobot(undefined)).toBe(false);
});

test("negative coordinates are rejected", () => {
  expect(isValidTarget(-1, 10)).toBe(false);
  expect(isValidTarget(10, -1)).toBe(false);
});
