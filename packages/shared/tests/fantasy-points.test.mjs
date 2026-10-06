import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFantasyPlayerPoints,
  calculateFantasyLineupPoints,
  getRatingFantasyPoints,
} from "../src/fantasy-points.ts";

function createPlayerInput(
  overrides = {},
) {
  return {
    player_id:
      "player-a",

    position:
      "CM",

    minutes_played:
      0,

    goals:
      0,

    assists:
      0,

    yellow_cards:
      0,

    red_cards:
      0,

    clean_sheet:
      false,

    starter:
      false,

    match_minutes:
      90,

    panel_rating:
      null,

    ...overrides,
  };
}

test(
  "rating fantasy points follow the configured score table",
  () => {
    const cases = [
      [0, -2],
      [1, -2],
      [2, -1],
      [3, -1],
      [4, 0],
      [5, 0],
      [6, 2],
      [7, 3],
      [8, 4],
      [9, 4],
      [10, 5],
    ];

    for (
      const [
        rating,
        expectedPoints,
      ] of cases
    ) {
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
  },
);

test(
  "rating uses standard rounding before applying fantasy points",
  () => {
    const cases = [
      [5.4, 5, 0],
      [5.5, 6, 2],
      [6.4, 6, 2],
      [6.5, 7, 3],
      [7.4, 7, 3],
      [7.5, 8, 4],
      [8.4, 8, 4],
      [8.5, 9, 4],
      [9.4, 9, 4],
      [9.5, 10, 5],
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
        `${panelRating} debería redondearse a ${expectedRounded}`,
      );

      assert.equal(
        result.points,
        expectedPoints,
        `${panelRating} debería dar ${expectedPoints} puntos`,
      );
    }
  },
);

test(
  "rating is limited to the 0 to 10 range",
  () => {
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
      5,
    );
  },
);

test(
  "player without panel rating gets no rating points",
  () => {
    const result =
      getRatingFantasyPoints(
        null,
      );

    assert.equal(
      result.points,
      0,
    );

    assert.equal(
      result.rounded_rating,
      null,
    );

    assert.equal(
      result.rateable,
      false,
    );
  },
);

test(
  "player total includes rating points",
  () => {
    const result =
      calculateFantasyPlayerPoints(
        createPlayerInput({
          minutes_played:
            90,

          starter:
            true,

          panel_rating:
            6.5,
        }),
      );

    /*
     * 90 minutos = 3 puntos
     * 6.5 -> 7 = 3 puntos
     *
     * Total = 6
     */
    assert.equal(
      result.player_id,
      "player-a",
    );

    assert.equal(
      result.breakdown.minutes,
      3,
    );

    assert.equal(
      result.breakdown.rating,
      3,
    );

    assert.equal(
      result.rounded_rating,
      7,
    );

    assert.equal(
      result.points,
      6,
    );

    assert.equal(
      result.rateable,
      true,
    );
  },
);

test(
  "lineup total is the sum of every player fantasy score",
  () => {
    const result =
      calculateFantasyLineupPoints([
        createPlayerInput({
          player_id:
            "1",

          panel_rating:
            6,
        }),

        createPlayerInput({
          player_id:
            "2",

          panel_rating:
            7,
        }),

        createPlayerInput({
          player_id:
            "3",

          panel_rating:
            8,
        }),

        createPlayerInput({
          player_id:
            "4",

          panel_rating:
            null,
        }),
      ]);

    assert.equal(
      result.players[0].points,
      2,
    );

    assert.equal(
      result.players[1].points,
      3,
    );

    assert.equal(
      result.players[2].points,
      4,
    );

    assert.equal(
      result.players[3].points,
      0,
    );

    assert.equal(
      result.total_points,
      9,
    );
  },
);