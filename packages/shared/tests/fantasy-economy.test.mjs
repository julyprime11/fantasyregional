import test from "node:test";
import assert from "node:assert/strict";

import {
  FANTASY_ECONOMY,
  getInitialFantasyPlayerPrice,
  getFantasyTeamPointsAverage,
  getNextFantasyPlayerPrice,
  getNextFantasyBudget,
  validateFantasyLineupBudget,
} from "../src/fantasy-economy.ts";

const eleven = (price) =>
  Array.from({ length: 11 }, (_, index) => ({ id: `player-${index + 1}`, price }));

test("the economy starts from a 100,000-euro budget with safe limits", () => {
  assert.equal(FANTASY_ECONOMY.initialBudget, 100_000);
  assert.equal(FANTASY_ECONOMY.maximumBudget, 120_000);
  assert.equal(FANTASY_ECONOMY.minimumPlayerPrice, 4_000);
  assert.equal(FANTASY_ECONOMY.maximumPlayerPrice, 18_000);
});

test("initial prices use up to three latest global final match scores", () => {
  assert.equal(getInitialFantasyPlayerPrice([]), 8_000);
  assert.equal(getInitialFantasyPlayerPrice([-3, 0, 0]), 5_000);
  assert.equal(getInitialFantasyPlayerPrice([1, 2, 3]), 7_000);
  assert.equal(getInitialFantasyPlayerPrice([4, 5, 6]), 9_000);
  assert.equal(getInitialFantasyPlayerPrice([6, 7, 8]), 11_000);
  assert.equal(getInitialFantasyPlayerPrice([8, 9, 10]), 13_000);
  assert.equal(getInitialFantasyPlayerPrice([11, 12, 13]), 15_000);
  assert.equal(getInitialFantasyPlayerPrice([100, 0, 0, 0]), 5_000);
  assert.throws(() => getInitialFantasyPlayerPrice([Number.NaN]), RangeError);
});

test("team average uses only players with valid global points", () => {
  assert.equal(getFantasyTeamPointsAverage([null, null]), null);
  assert.equal(getFantasyTeamPointsAverage([null, 0, 4, 8]), 4);
  assert.throws(() => getFantasyTeamPointsAverage([Infinity]), RangeError);
});

test("prices change by relative performance and never by more than two", () => {
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: 10, teamAveragePoints: 4 }), 10000);
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: 6, teamAveragePoints: 4 }), 9000);
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: 5, teamAveragePoints: 4 }), 8000);
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: 2, teamAveragePoints: 4 }), 7000);
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: 0, teamAveragePoints: 4 }), 6000);
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: null, teamAveragePoints: null }), 8000);
});

test("price caps prevent runaway inflation or negative player costs", () => {
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 18000, fantasyPoints: 20, teamAveragePoints: 5 }), 18000);
  assert.equal(getNextFantasyPlayerPrice({ currentPrice: 4000, fantasyPoints: -5, teamAveragePoints: 5 }), 4000);
  assert.throws(() => getNextFantasyPlayerPrice({ currentPrice: 0, fantasyPoints: 6, teamAveragePoints: 4 }), RangeError);
  assert.throws(() => getNextFantasyPlayerPrice({ currentPrice: 8000, fantasyPoints: 6, teamAveragePoints: null }), RangeError);
});

test("budget grows only on finalized matchdays, by at most two credits", () => {
  assert.equal(getNextFantasyBudget(100_000, null), 100000);
  assert.equal(getNextFantasyBudget(100_000, -10), 100000);
  assert.equal(getNextFantasyBudget(100_000, 19), 100000);
  assert.equal(getNextFantasyBudget(100_000, 20), 101000);
  assert.equal(getNextFantasyBudget(100_000, 39), 101000);
  assert.equal(getNextFantasyBudget(100_000, 40), 102000);
  assert.equal(getNextFantasyBudget(100_000, 100), 102000);
  assert.equal(getNextFantasyBudget(119_000, 100), 120000);
  assert.equal(getNextFantasyBudget(120_000, 100), 120000);
  assert.throws(() => getNextFantasyBudget(121_000, 100), RangeError);
});

test("a valid XI can use the full budget, without spending credits", () => {
  const result = validateFantasyLineupBudget(eleven(8_000), 88_000);
  assert.equal(result.valid, true);
  assert.equal(result.totalCost, 88_000);
  assert.equal(result.remainingBudget, 0);
});

test("lineups exceeding the limit or containing duplicate players are rejected", () => {
  const overBudget = validateFantasyLineupBudget(eleven(10_000), 100_000);
  assert.equal(overBudget.valid, false);
  assert.match(overBudget.errors.join(" "), /supera el presupuesto/);

  const duplicate = eleven(8_000);
  duplicate[10] = { ...duplicate[0] };
  const invalid = validateFantasyLineupBudget(duplicate, 100);
  assert.equal(invalid.valid, false);
  assert.match(invalid.errors.join(" "), /duplicado/);
});

test("budget validation rejects invalid prices and incomplete XIs", () => {
  const invalidPrice = validateFantasyLineupBudget(eleven(3_000), 100_000);
  assert.equal(invalidPrice.valid, false);
  assert.match(invalidPrice.errors.join(" "), /precio/);

  const incomplete = validateFantasyLineupBudget(eleven(8_000).slice(0, 10), 100_000);
  assert.equal(incomplete.valid, false);
  assert.match(incomplete.errors.join(" "), /exactamente 11/);

  const invalidBudget = validateFantasyLineupBudget(eleven(8_000), -1);
  assert.equal(invalidBudget.valid, false);
  assert.match(invalidBudget.errors.join(" "), /Presupuesto no válido/);
});
