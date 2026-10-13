import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFantasyLineupPoints,
  calculateFantasyPlayerPoints,
  FANTASY_MVP_POINTS,
  getRatingFantasyPoints,
} from "../src/fantasy-points.ts";

function createPlayerInput(
  overrides = {},
) {
  return {
    player_id: "player-a",
    position: "CM",
    minutes_played: 0,
    goals: 0,
    assists: 0,
    yellow_cards: 0,
    red_cards: 0,
    clean_sheet: false,
    starter: false,
    match_minutes: 90,
    panel_rating: null,
    is_mvp: false,
    ...overrides,
  };
}

test("rating fantasy points use the reduced modifier table", () => {
  const cases = [
    [0, -2],
    [1, -2],
    [2, -2],
    [3, -1],
    [4, -1],
    [5, 0],
    [6, 1],
    [7, 1],
    [8, 2],
    [9, 2],
    [10, 3],
  ];

  for (const [rating, expectedPoints] of cases) {
    const result =
      getRatingFantasyPoints(
        rating,
      );

    assert.equal(
      result.points,
      expectedPoints,
      `La nota ${rating} debería dar ${expectedPoints} puntos`,
    );

    assert.equal(
      result.rounded_rating,
      rating,
    );

    assert.equal(
      result.rateable,
      true,
    );
  }
});

test("rating uses standard rounding before applying fantasy points", () => {
  const cases = [
    [2.4, 2, -2],
    [2.5, 3, -1],
    [4.4, 4, -1],
    [4.5, 5, 0],
    [5.5, 6, 1],
    [6.5, 7, 1],
    [7.5, 8, 2],
    [8.5, 9, 2],
    [9.5, 10, 3],
  ];

  for (
    const [
      panelRating,
      expectedRounded,
      expectedPoints,
    ] of cases
  ) {
    const result =
      getRatingFantasyPoints(
        panelRating,
      );

    assert.equal(
      result.rounded_rating,
      expectedRounded,
    );

    assert.equal(
      result.points,
      expectedPoints,
    );
  }
});

test("rating is limited to the 0 to 10 range", () => {
  const belowZero =
    getRatingFantasyPoints(
      -4,
    );

  assert.equal(
    belowZero.rounded_rating,
    0,
  );
  assert.equal(
    belowZero.points,
    -2,
  );

  const aboveTen =
    getRatingFantasyPoints(
      15,
    );

  assert.equal(
    aboveTen.rounded_rating,
    10,
  );
  assert.equal(
    aboveTen.points,
    3,
  );
});

test("player without panel rating gets no rating points", () => {
  const result =
    getRatingFantasyPoints(
      null,
    );

  assert.equal(result.points, 0);
  assert.equal(result.rounded_rating, null);
  assert.equal(result.rateable, false);
});

test("player total includes the reduced rating modifier", () => {
  const result =
    calculateFantasyPlayerPoints(
      createPlayerInput({
        minutes_played: 90,
        starter: true,
        panel_rating: 6.5,
      }),
    );

  assert.equal(result.breakdown.minutes, 3);
  assert.equal(result.breakdown.rating, 1);
  assert.equal(result.rounded_rating, 7);
  assert.equal(result.points, 4);
  assert.equal(result.rateable, true);
});

test("MVP bonus is centralized and worth two points", () => {
  assert.equal(
    FANTASY_MVP_POINTS,
    2,
  );

  const result =
    calculateFantasyPlayerPoints(
      createPlayerInput({
        minutes_played: 90,
        panel_rating: 8,
        is_mvp: true,
      }),
    );

  assert.equal(
    result.breakdown.mvp,
    2,
  );

  assert.equal(
    result.points,
    7,
  );
});

test("lineup total is the sum of every player fantasy score", () => {
  const result =
    calculateFantasyLineupPoints([
      createPlayerInput({
        player_id: "1",
        panel_rating: 6,
      }),
      createPlayerInput({
        player_id: "2",
        panel_rating: 7,
      }),
      createPlayerInput({
        player_id: "3",
        panel_rating: 8,
      }),
      createPlayerInput({
        player_id: "4",
        panel_rating: null,
      }),
    ]);

  assert.equal(result.players[0].points, 1);
  assert.equal(result.players[1].points, 1);
  assert.equal(result.players[2].points, 2);
  assert.equal(result.players[3].points, 0);
  assert.equal(result.total_points, 4);
});
