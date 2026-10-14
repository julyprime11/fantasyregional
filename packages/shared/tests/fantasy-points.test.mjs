import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFantasyLineupPoints,
  calculateFantasyPlayerPoints,
  FANTASY_MVP_POINTS,
  getFantasyCaptainBonus,
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
        minutes_played: 15,
        panel_rating: 6,
      }),
      createPlayerInput({
        player_id: "2",
        minutes_played: 15,
        panel_rating: 7,
      }),
      createPlayerInput({
        player_id: "3",
        minutes_played: 15,
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

test("clean sheet points scale from forward to goalkeeper", () => {
  const cases = [
    ["ST", 1],
    ["CM", 2],
    ["CB", 3],
    ["GK", 4],
  ];

  for (const [position, expected] of cases) {
    const result = calculateFantasyPlayerPoints(
      createPlayerInput({
        position,
        minutes_played: 90,
        starter: true,
        clean_sheet: true,
      }),
    );
    assert.equal(result.breakdown.clean_sheet, expected, position);
  }

  // La restricción ya existente para porteros continúa vigente.
  const substitutedGoalkeeper = calculateFantasyPlayerPoints(
    createPlayerInput({
      position: "GK",
      starter: true,
      minutes_played: 75,
      clean_sheet: true,
    }),
  );
  assert.equal(substitutedGoalkeeper.breakdown.clean_sheet, 0);
});

test("direct red is -5 and second yellow dismissal is -4 total", () => {
  const cases = [
    [{ yellow_cards: 1 }, -2],
    [{ yellow_cards: 2, red_cards: 1 }, -4],
    [{ red_cards: 1 }, -5],
    [{ yellow_cards: 1, red_cards: 1 }, -7],
  ];

  for (const [cards, expected] of cases) {
    const result = calculateFantasyPlayerPoints(
      createPlayerInput(cards),
    );
    assert.equal(result.breakdown.cards, expected);
  }
});

test("explicit direct vs second-yellow dismissal", () => {
  const cards = (overrides) =>
    calculateFantasyPlayerPoints(createPlayerInput(overrides)).breakdown.cards;
  assert.equal(cards({yellow_cards: 2,red_cards: 1,red_card_reason:"direct"}),-9);
  assert.equal(cards({yellow_cards: 2,red_cards: 1,red_card_reason:"second_yellow"}),-4);
  assert.equal(cards({yellow_cards: 1,red_cards: 1,red_card_reason:"direct"}),-7);
  assert.equal(cards({yellow_cards: 2,red_cards: 1}),-4);
});

test("captain bonus includes positive, negative and zero final points", () => {
  const lineup = calculateFantasyLineupPoints([
    createPlayerInput({
      player_id: "captain-positive",
      minutes_played: 15,
      panel_rating: 10,
      is_mvp: true,
    }),
    createPlayerInput({
      player_id: "captain-negative",
      minutes_played: 15,
      panel_rating: 0,
    }),
    createPlayerInput({
      player_id: "captain-zero",
      panel_rating: 5,
    }),
  ]);

  assert.equal(getFantasyCaptainBonus(lineup.players, "captain-positive"), 5);
  assert.equal(getFantasyCaptainBonus(lineup.players, "captain-negative"), -2);
  assert.equal(getFantasyCaptainBonus(lineup.players, "captain-zero"), 0);
  assert.equal(getFantasyCaptainBonus(lineup.players, null), 0);
  assert.equal(getFantasyCaptainBonus(lineup.players, "not-in-xi"), 0);

  assert.equal(lineup.total_points, 3);
  assert.equal(lineup.total_points + getFantasyCaptainBonus(lineup.players, "captain-positive"), 8);
  assert.equal(lineup.total_points + getFantasyCaptainBonus(lineup.players, "captain-negative"), 1);
});

test("players with zero minutes always receive zero including captain", () => {
  const result = calculateFantasyPlayerPoints(createPlayerInput({
    minutes_played: 0,
    goals: 2,
    assists: 1,
    yellow_cards: 1,
    red_cards: 1,
    clean_sheet: true,
    starter: true,
    panel_rating: 10,
    is_mvp: true,
  }));
  assert.equal(result.points, 0);
  assert.deepEqual(result.breakdown, {
    minutes: 0, goals: 0, assists: 0,
    clean_sheet: 0, cards: 0, rating: 0, mvp: 0,
  });
  assert.equal(result.rateable, false);
  assert.equal(result.rounded_rating, null);
  assert.equal(getFantasyCaptainBonus([result], result.player_id), 0);
});
