import test from "node:test";
import assert from "node:assert/strict";

import {
  calculatePanelRating,
  calculatePlayerRating,
  DEFAULT_RATING_CONFIG,
  LEGACY_RATING_CONFIG,
  getResultsPhase,
  minutesCoefficient,
  selectMatchMvp,
} from "../src/ratings.ts";

const player = (overrides = {}) => ({
  player_id: "player-a",
  position: "ST",
  minutes_played: 90,
  goals: 0,
  assists: 0,
  yellow_cards: 0,
  red_cards: 0,
  clean_sheet: false,
  votes: [
    {
      score: 8,
      voter_role: "entrenador",
    },
  ],
  ...overrides,
});

const near = (actual, expected) =>
  assert.ok(
    Math.abs(actual - expected) < 1e-10,
    `${actual} != ${expected}`,
  );

test("V2 default group weights are players 30%, directors 35% and coaches 35%", () => {
  assert.deepEqual(
    DEFAULT_RATING_CONFIG.groupWeights,
    {
      players: 0.3,
      directors: 0.35,
      coaches: 0.35,
    },
  );

  const result = calculatePlayerRating(
    player({
      votes: [
        { score: 6, voter_role: "player" },
        { score: 8, voter_role: "directiva" },
        { score: 10, voter_role: "entrenador" },
      ],
    }),
  );

  assert.equal(result.status, "rated");
  near(result.final_rating, 8.1);
  near(result.panel_average, 8.1);
  assert.equal(result.rounded_rating, 8);
  assert.equal(result.statistical_score, null);
});

test("V1 weighting stays available for historic matches", () => {
  assert.deepEqual(LEGACY_RATING_CONFIG.groupWeights, {
    players: 0.2, directors: 0.3, coaches: 0.5,
  });
  const historical = calculatePlayerRating(player({ votes: [
    { score: 6, voter_role: "player" },
    { score: 8, voter_role: "directiva" },
    { score: 10, voter_role: "entrenador" },
  ] }), LEGACY_RATING_CONFIG);
  assert.equal(historical.status, "rated");
  near(historical.final_rating, 8.6);
  assert.equal(historical.rounded_rating, 9);
});

test("votes are averaged inside each group before applying group weights", () => {
  const panel = calculatePanelRating([
    { score: 4, voter_role: "player" },
    { score: 8, voter_role: "player" },
    { score: 8, voter_role: "directiva" },
    { score: 9, voter_role: "entrenador" },
    { score: 7, voter_role: "cuerpo_tecnico" },
  ]);

  near(panel.groups.players.average, 6);
  near(panel.groups.directors.average, 8);
  near(panel.groups.coaches.average, 8);
  near(panel.panel_average, 7.4);
  assert.equal(panel.vote_count, 5);
});

test("missing groups redistribute their configured weight proportionally", () => {
  const panel = calculatePanelRating([
    { score: 6, voter_role: "player" },
    { score: 8, voter_role: "directiva" },
  ]);

  near(panel.groups.players.applied_weight, 6 / 13);
  near(panel.groups.directors.applied_weight, 7 / 13);
  near(panel.groups.coaches.applied_weight, 0);
  near(panel.panel_average, 92 / 13);
});

test("legacy jugador votes remain in the players group and unknown roles are ignored", () => {
  const panel = calculatePanelRating([
    { score: 6, voter_role: "jugador" },
    { score: 8, voter_role: "unknown" },
  ]);

  assert.equal(panel.vote_count, 1);
  assert.equal(panel.groups.players.vote_count, 1);
  assert.equal(panel.panel_average, 6);
});

test("statistics do not modify the human rating", () => {
  const base = calculatePlayerRating(player());
  const extreme = calculatePlayerRating(
    player({
      goals: 10,
      assists: 8,
      yellow_cards: 4,
      red_cards: 2,
      clean_sheet: true,
    }),
  );

  assert.equal(base.status, "rated");
  assert.equal(extreme.status, "rated");
  assert.equal(base.final_rating, 8);
  assert.equal(extreme.final_rating, 8);
  assert.equal(extreme.statistical_score, null);
});

test("zero minutes makes a player non-rateable", () => {
  const result = calculatePlayerRating(
    player({
      minutes_played: 0,
    }),
  );

  assert.equal(result.status, "no_minutes");
  assert.equal(result.final_rating, null);
});

test("missing votes suppress the final rating", () => {
  const result = calculatePlayerRating(
    player({
      votes: [],
    }),
  );

  assert.equal(result.status, "insufficient_votes");
  assert.equal(result.vote_count, 0);
  assert.equal(result.panel_average, null);
  assert.equal(result.final_rating, null);
});

test("minimumVotes is enforced", () => {
  const result = calculatePlayerRating(
    player(),
    {
      minimumVotes: 2,
    },
  );

  assert.equal(result.status, "insufficient_votes");
  assert.match(result.reason, /2/);

  const enough = calculatePlayerRating(
    player({
      votes: [
        { score: 8, voter_role: "player" },
        { score: 8, voter_role: "directiva" },
      ],
    }),
    {
      minimumVotes: 2,
    },
  );

  assert.equal(enough.status, "rated");
  assert.equal(enough.final_rating, 8);
});

test("group weights are configurable and validated", () => {
  const result = calculatePlayerRating(
    player({
      votes: [
        { score: 4, voter_role: "player" },
        { score: 8, voter_role: "directiva" },
        { score: 10, voter_role: "entrenador" },
      ],
    }),
    {
      groupWeights: {
        players: 1,
        directors: 1,
        coaches: 2,
      },
    },
  );

  near(result.final_rating, 8);

  assert.throws(
    () =>
      calculatePlayerRating(
        player(),
        {
          groupWeights: {
            players: 0,
            directors: 0.3,
            coaches: 0.5,
          },
        },
      ),
    RangeError,
  );
});

test("invalid vote scores cannot produce a normal rating", () => {
  const result = calculatePlayerRating(
    player({
      votes: [
        {
          score: 11,
          voter_role: "entrenador",
        },
      ],
    }),
  );

  assert.equal(result.status, "invalid_data");
  assert.equal(result.final_rating, null);
});

test("V1 and V2 keep their own MVP winner", () => {
  const a = player({ player_id: "a", votes: [
    { score: 10, voter_role: "player" },
    { score: 5, voter_role: "directiva" },
    { score: 3, voter_role: "entrenador" },
  ] });
  const b = player({ player_id: "b", votes: [
    { score: 4, voter_role: "player" },
    { score: 5, voter_role: "directiva" },
    { score: 8, voter_role: "entrenador" },
  ] });
  assert.deepEqual(selectMatchMvp([
    calculatePlayerRating(a, LEGACY_RATING_CONFIG),
    calculatePlayerRating(b, LEGACY_RATING_CONFIG),
  ]).players.map((p) => p.player_id), ["b"]);
  assert.deepEqual(selectMatchMvp([
    calculatePlayerRating(a, DEFAULT_RATING_CONFIG),
    calculatePlayerRating(b, DEFAULT_RATING_CONFIG),
  ]).players.map((p) => p.player_id), ["a"]);
});

test("MVP uses the highest unrounded human rating and keeps exact ties", () => {
  const best = calculatePlayerRating(
    player({
      player_id: "a",
      votes: [
        { score: 8.5, voter_role: "entrenador" },
      ],
    }),
  );

  const tie = calculatePlayerRating(
    player({
      player_id: "b",
      votes: [
        { score: 8.5, voter_role: "directiva" },
      ],
    }),
  );

  const lower = calculatePlayerRating(
    player({
      player_id: "c",
      votes: [
        { score: 8.49, voter_role: "player" },
      ],
    }),
  );

  const result = selectMatchMvp([
    lower,
    tie,
    best,
  ]);

  assert.equal(result.status, "shared");
  assert.deepEqual(
    result.players.map(
      (item) => item.player_id,
    ),
    ["a", "b"],
  );
});

test("voting results are provisional and closed results are final", () => {
  assert.equal(getResultsPhase("voting"), "provisional");
  assert.equal(getResultsPhase("closed"), "final");
  assert.equal(getResultsPhase("scheduled"), null);
  assert.equal(getResultsPhase("finished"), null);
});

test("minimum vote configuration rejects invalid thresholds", () => {
  for (const minimumVotes of [0, -1, 1.5, NaN, Infinity]) {
    assert.throws(
      () =>
        calculatePlayerRating(
          player(),
          { minimumVotes },
        ),
      RangeError,
    );
  }
});

test("minutesCoefficient remains only for backwards compatibility", () => {
  for (const [minutes, coefficient] of [
    [0, 0],
    [1, 0.1],
    [9, 0.1],
    [10, 0.4],
    [29, 0.4],
    [30, 0.7],
    [59, 0.7],
    [60, 1],
    [120, 1],
  ]) {
    assert.equal(
      minutesCoefficient(minutes),
      coefficient,
    );
  }
});
