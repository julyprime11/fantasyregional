import test from "node:test";
import assert from "node:assert/strict";
import { calculatePlayerRating, minutesCoefficient, selectMatchMvp, DEFAULT_RATING_CONFIG, getResultsPhase } from "../src/ratings.ts";

const player = (overrides = {}) => ({
  player_id: "player-a", position: "ST", minutes_played: 90, goals: 0, assists: 0,
  yellow_cards: 0, red_cards: 0, clean_sheet: false,
  votes: [{ score: 8, voter_role: "Entrenador" }], ...overrides,
});
const near = (actual, expected) => assert.ok(Math.abs(actual - expected) < 1e-10, `${actual} != ${expected}`);

test("forward goal: 70% panel and 30% statistics", () => {
  const result = calculatePlayerRating(player({ goals: 1 }));
  assert.equal(result.status, "rated");
  assert.equal(result.statistical_score, 7);
  near(result.final_rating, 7.7);
});
test("defender clean sheet and goalkeeper/midfielder/winger modifiers", () => {
  near(calculatePlayerRating(player({ position: "CB", clean_sheet: true })).statistical_score, 6.6);
  near(calculatePlayerRating(player({ position: "GK", goals: 1, clean_sheet: true })).statistical_score, 8.8);
  near(calculatePlayerRating(player({ position: "CM", goals: 1, clean_sheet: true })).statistical_score, 7.4);
  near(calculatePlayerRating(player({ position: "RW", goals: 1, clean_sheet: true })).statistical_score, 7);
});
test("assists, yellow and red cards", () => {
  near(calculatePlayerRating(player({ assists: 1, yellow_cards: 1, red_cards: 1 })).statistical_score, 4.7);
});
test("minutes band boundaries and low-minute modifier attenuation", () => {
  for (const [minutes, coefficient] of [[0,0],[1,0.1],[9,0.1],[10,0.4],[29,0.4],[30,0.7],[59,0.7],[60,1],[120,1]]) {
    assert.equal(minutesCoefficient(minutes), coefficient);
    if (minutes > 0) near(calculatePlayerRating(player({ minutes_played: minutes, goals: 1 })).statistical_score, 6 + coefficient);
  }
  const result = calculatePlayerRating(player({ minutes_played: 0, goals: 1 }));
  assert.equal(result.status, "no_minutes");
  assert.equal(result.final_rating, null);
});
test("missing votes explicitly suppress final rating", () => {
  const result = calculatePlayerRating(player({ votes: [] }));
  assert.equal(result.status, "insufficient_votes");
  assert.equal(result.vote_count, 0);
  assert.equal(result.panel_average, null);
  assert.equal(result.statistical_score, 6);
  assert.equal(result.final_rating, null);
});
test("statistics and final ratings clamp at both ends", () => {
  const high = calculatePlayerRating(player({ goals: 100, votes: [{ score: 10, voter_role: "player" }] }));
  const low = calculatePlayerRating(player({ red_cards: 100, votes: [{ score: 1, voter_role: "player" }] }));
  assert.equal(high.statistical_score, 10); assert.equal(high.final_rating, 10);
  assert.equal(low.statistical_score, 1); assert.equal(low.final_rating, 1);
});
test("equal role weights by default, configurable in the future", () => {
  const input = player({ votes: [{ score: 10, voter_role: "coach" }, { score: 6, voter_role: "player" }] });
  assert.equal(calculatePlayerRating(input).panel_average, 8);
  assert.equal(calculatePlayerRating(input, { roleWeights: { coach: 3 } }).panel_average, 9);
  assert.equal(calculatePlayerRating(input).vote_count, 2);
});
test("all exact top ties are joint MVPs, ordered only for presentation", () => {
  const best = calculatePlayerRating(player({ player_id: "a", goals: 1 }));
  const tie = calculatePlayerRating(player({ player_id: "b", goals: 1 }));
  const lower = calculatePlayerRating(player({ player_id: "c" }));
  const noVotes = calculatePlayerRating(player({ player_id: "d", goals: 100, votes: [] }));
  const result = selectMatchMvp([lower, noVotes, tie, best]);
  assert.equal(result.status, "shared");
  assert.deepEqual(result.players.map(item => item.player_id), ["a", "b"]);
  assert.deepEqual(selectMatchMvp([best, tie]), result);
  assert.equal(selectMatchMvp([best, lower]).status, "single");
  assert.equal(selectMatchMvp([noVotes]).status, "none");
  assert.deepEqual(selectMatchMvp([]).players, []);
});

test("voting results are provisional; closed results are final", () => {
  assert.equal(getResultsPhase("voting"), "provisional");
  assert.equal(getResultsPhase("closed"), "final");
  assert.equal(getResultsPhase("scheduled"), null);
  assert.equal(getResultsPhase("finished"), null);
});

test("minimumVotes defaults to 1 and explicit 1 preserves the formula", () => {
  assert.equal(DEFAULT_RATING_CONFIG.minimumVotes, 1);
  const result = calculatePlayerRating(player());
  assert.equal(result.status, "rated");
  assert.deepEqual(calculatePlayerRating(player(), { minimumVotes: 1 }), result);
  near(result.final_rating, 7.4);
});

test("insufficient panel size suppresses final rating and MVP but preserves averages", () => {
  const result = calculatePlayerRating(player(), { minimumVotes: 30 });
  assert.equal(result.status, "insufficient_votes");
  assert.equal(result.vote_count, 1);
  assert.equal(result.panel_average, 8);
  assert.equal(result.statistical_score, 6);
  assert.equal(result.final_rating, null);
  assert.match(result.reason, /30/);
  assert.equal(selectMatchMvp([result]).status, "none");
  const enough = calculatePlayerRating(player({ votes: Array.from({ length: 30 }, () => ({ score: 8, voter_role: "panel" })) }), { minimumVotes: 30 });
  assert.equal(enough.status, "rated"); near(enough.final_rating, 7.4);
});

test("minimum vote configuration rejects invalid thresholds", () => {
  for (const minimumVotes of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(() => calculatePlayerRating(player(), { minimumVotes }), RangeError);
  }
});

test("display rounding does not create a joint MVP", () => {
  const a = calculatePlayerRating(player({ player_id: "a" }));
  const b = calculatePlayerRating(player({ player_id: "b", votes: [{ score: 8.001, voter_role: "panel" }] }));
  assert.equal(a.final_rating.toFixed(2), b.final_rating.toFixed(2));
  const result = selectMatchMvp([a, b]);
  assert.equal(result.status, "single");
  assert.equal(result.players[0].player_id, "b");
});
test("invalid source data cannot produce a normal rating", () => {
  for (const changes of [{ position: null }, { minutes_played: -1 }, { goals: NaN }, { votes: [{ score: 11, voter_role: "coach" }] }]) {
    const result = calculatePlayerRating(player(changes));
    assert.equal(result.status, "invalid_data"); assert.equal(result.final_rating, null);
  }
});
