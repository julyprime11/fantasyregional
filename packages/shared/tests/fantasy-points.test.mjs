import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFantasyPlayerPoints,
  calculateFantasyLineupPoints,
} from "../src/fantasy-points.ts";

test("player rating is rounded to integer fantasy points", () => {
  const result =
    calculateFantasyPlayerPoints({
      player_id: "player-a",
      final_rating: 7.4,
    });

  assert.equal(result.player_id, "player-a");
  assert.equal(result.points, 7);
  assert.equal(result.rateable, true);
});

test("player rating rounds up from .5", () => {
  const result =
    calculateFantasyPlayerPoints({
      player_id: "player-a",
      final_rating: 7.5,
    });

  assert.equal(result.points, 8);
});

test("player without final rating scores zero", () => {
  const result =
    calculateFantasyPlayerPoints({
      player_id: "player-a",
      final_rating: null,
    });

  assert.equal(result.points, 0);
  assert.equal(result.rateable, false);
});

test("lineup total is the sum of rounded player points", () => {
  const result =
    calculateFantasyLineupPoints([
      {
        player_id: "1",
        final_rating: 7.4,
      },
      {
        player_id: "2",
        final_rating: 6.8,
      },
      {
        player_id: "3",
        final_rating: 8.1,
      },
      {
        player_id: "4",
        final_rating: null,
      },
    ]);

  assert.equal(result.players[0].points, 7);
  assert.equal(result.players[1].points, 7);
  assert.equal(result.players[2].points, 8);
  assert.equal(result.players[3].points, 0);

  assert.equal(
    result.total_points,
    22,
  );
});