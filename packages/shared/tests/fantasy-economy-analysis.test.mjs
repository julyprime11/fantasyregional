import test from "node:test";
import assert from "node:assert/strict";
import {
  OPENING_BUDGET_SCENARIOS,
  analyzeOpeningFantasyEconomy,
  getOpeningBudgetForScenario,
} from "../src/fantasy-economy-analysis.ts";
import { getOpeningFantasyBudget } from "../src/fantasy-economy.ts";

const ids = Array.from({ length: 11 }, (_, i) => `p${i}`);
const base = {
  allPlayerIds: ids,
  firstMatchPlayerPoints: ids.map((playerId) => ({ playerId, points: 4 })),
  memberUserIds: ["alice", "bob", "carol"],
  firstMatchLineups: [
    { userId: "alice", playerIds: ids, totalPoints: 42 },
    { userId: "bob", playerIds: ids, totalPoints: 12 },
  ],
};

test("opening XI costs use first official prices and 100k, not earned budget", () => {
  const report = analyzeOpeningFantasyEconomy(base);
  assert.equal(report.lineupsChecked, 2);
  assert.equal(report.lineupsOverBudget, 0);
  assert.equal(report.percentageOverBudget, 0);
  assert.equal(report.distinctLineups, 1);
  assert.equal(report.mostRepeatedLineupUsers, 2);
  assert.equal(report.members[0].lineupCost, 99_000);
  assert.equal(report.members[0].openingBudget, 98_000);
  assert.equal(report.members[1].openingBudget, 98_000);
});

test("a submitted XI over 100k requires a change, missing XI is not zero points", () => {
  const report = analyzeOpeningFantasyEconomy({
    ...base,
    firstMatchPlayerPoints: ids.map((playerId) => ({ playerId, points: 6 })),
  });
  assert.equal(report.lineupsChecked, 2);
  assert.equal(report.lineupsOverBudget, 2);
  assert.equal(report.percentageOverBudget, 100);
  assert.equal(report.usersNeedingChange, 2);
  assert.equal(report.members[0].lineupCost, 121_000);
  assert.equal(report.members[2].hasLineup, false);
  assert.equal(report.members[2].lineupCost, null);
  assert.equal(report.members[2].points, null);
  assert.equal(report.members[2].openingBudget, 100_000);
});

test("a XI costing exactly 100k is accepted", () => {
  const report = analyzeOpeningFantasyEconomy({
    allPlayerIds: ids,
    firstMatchPlayerPoints: [
      ...ids.slice(0, 9).map((playerId) => ({ playerId, points: 4 })),
      { playerId: ids[9], points: 7 },
    ],
    memberUserIds: ["one"],
    firstMatchLineups: [{ userId: "one", playerIds: ids, totalPoints: 30 }],
  });
  assert.equal(report.members[0].lineupCost, 100_000);
  assert.equal(report.lineupsOverBudget, 0);
});

test("current scenario is exactly the existing official budget formula", () => {
  for (const points of [null, -3, 0, 9, 10, 19, 20, 29, 30, 39, 40, 100]) {
    assert.equal(getOpeningBudgetForScenario(points, OPENING_BUDGET_SCENARIOS[0]),
      getOpeningFantasyBudget(points));
  }
});

test("scenario comparison makes budget thresholds measurable, not active", () => {
  const report = analyzeOpeningFantasyEconomy(base);
  assert.deepEqual(report.scenarios.map((s) => [s.id, s.losing, s.unchanged, s.gaining]), [
    ["current", 2, 1, 0],
    ["intermediate", 1, 1, 1],
    ["demanding", 1, 2, 0],
  ]);
  assert.equal(report.scenarios[0].distinctBudgets, 2);
});

test("rejects repeated lineups, invalid players and invalid score data", () => {
  assert.throws(() => analyzeOpeningFantasyEconomy({
    ...base,
    firstMatchLineups: [base.firstMatchLineups[0], base.firstMatchLineups[0]],
  }), RangeError);
  assert.throws(() => analyzeOpeningFantasyEconomy({
    ...base,
    firstMatchLineups: [{ ...base.firstMatchLineups[0], playerIds: [...ids.slice(0, 10), "invalid"] }],
  }), RangeError);
  assert.throws(() => analyzeOpeningFantasyEconomy({
    ...base,
    firstMatchLineups: [{ ...base.firstMatchLineups[0], totalPoints: Number.NaN }],
  }), RangeError);
});

test("calibrated 65/70/75/80 scenario matches current official budget formula", () => {
  const current = OPENING_BUDGET_SCENARIOS[0];
  for (const points of [null, -10, 64, 65, 69, 70, 74, 75, 79, 80, 100]) {
    assert.equal(getOpeningBudgetForScenario(points, current), getOpeningFantasyBudget(points));
  }
});
