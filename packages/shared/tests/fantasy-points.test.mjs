import test from "node:test";
import assert from "node:assert/strict";

import {
  calculateFantasyLineupPoints,
  calculateFantasyPlayerPoints,
  FANTASY_MVP_POINTS,
  getFantasyCaptainBonus,
  getGoalsConcededFantasyPoints,
  getMatchGoalsConcededOnField,
  countGoalsConcededOnField,
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

test("rating fantasy points use the updated modifier table", () => {
  const cases = [
    [0, -2],
    [1, -2],
    [2, -2],
    [3, -1],
    [4, -1],
    [5, 0],
    [6, 2],
    [7, 2],
    [8, 3],
    [9, 3],
    [10, 4],
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
    [5.5, 6, 2],
    [6.5, 7, 2],
    [7.5, 8, 3],
    [8.5, 9, 3],
    [9.5, 10, 4],
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
    4,
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

test("player total includes the updated rating modifier", () => {
  const result =
    calculateFantasyPlayerPoints(
      createPlayerInput({
        minutes_played: 90,
        starter: true,
        panel_rating: 6.5,
      }),
    );

  assert.equal(result.breakdown.minutes, 3);
  assert.equal(result.breakdown.rating, 2);
  assert.equal(result.rounded_rating, 7);
  assert.equal(result.points, 5);
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
    8,
  );
});

test("lineup total is the sum of every player fantasy score", () => {
  const result =
    calculateFantasyLineupPoints([
      createPlayerInput({
        player_id: "1",
        minutes_played: 1,
        panel_rating: 6,
      }),
      createPlayerInput({
        player_id: "2",
        minutes_played: 1,
        panel_rating: 7,
      }),
      createPlayerInput({
        player_id: "3",
        minutes_played: 1,
        panel_rating: 8,
      }),
      createPlayerInput({
        player_id: "4",
        panel_rating: null,
      }),
    ]);

  assert.equal(result.players[0].points, 2);
  assert.equal(result.players[1].points, 2);
  assert.equal(result.players[2].points, 3);
  assert.equal(result.players[3].points, 0);
  assert.equal(result.total_points, 7);
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
      createPlayerInput({ ...cards, minutes_played: 1 }),
    );
    assert.equal(result.breakdown.cards, expected);
  }
});

test("explicit direct vs second-yellow dismissal", () => {
  const cards = (overrides) =>
    calculateFantasyPlayerPoints(createPlayerInput({ ...overrides, minutes_played: 1 })).breakdown.cards;
  assert.equal(cards({yellow_cards: 2,red_cards: 1,red_card_reason:"direct"}),-9);
  assert.equal(cards({yellow_cards: 2,red_cards: 1,red_card_reason:"second_yellow"}),-4);
  assert.equal(cards({yellow_cards: 1,red_cards: 1,red_card_reason:"direct"}),-7);
  assert.equal(cards({yellow_cards: 2,red_cards: 1}),-4);
});

test("captain bonus includes positive, negative and zero final points", () => {
  const lineup = calculateFantasyLineupPoints([
    createPlayerInput({
      player_id: "captain-positive",
      minutes_played: 1,
      panel_rating: 10,
      is_mvp: true,
    }),
    createPlayerInput({
      player_id: "captain-negative",
      minutes_played: 1,
      panel_rating: 0,
    }),
    createPlayerInput({
      player_id: "captain-zero",
      panel_rating: 5,
    }),
  ]);

  assert.equal(getFantasyCaptainBonus(lineup.players, "captain-positive"), 6);
  assert.equal(getFantasyCaptainBonus(lineup.players, "captain-negative"), -2);
  assert.equal(getFantasyCaptainBonus(lineup.players, "captain-zero"), 0);
  assert.equal(getFantasyCaptainBonus(lineup.players, null), 0);
  assert.equal(getFantasyCaptainBonus(lineup.players, "not-in-xi"), 0);

  assert.equal(lineup.total_points, 4);
  assert.equal(lineup.total_points + getFantasyCaptainBonus(lineup.players, "captain-positive"), 10);
  assert.equal(lineup.total_points + getFantasyCaptainBonus(lineup.players, "captain-negative"), 2);
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
    clean_sheet: 0, goals_conceded: 0, cards: 0, rating: 0, mvp: 0,
  });
  assert.equal(result.rateable, false);
  assert.equal(result.rounded_rating, null);
  assert.equal(getFantasyCaptainBonus([result], result.player_id), 0);
});

test("goals conceded penalty uses position-specific complete groups", () => {
  const cases = [
    ["GK", [0, -1, -2, -3, -4]],
    ["CB", [0, 0, -1, -1, -2]],
    ["CM", [0, 0, 0, -1, -1]],
    ["ST", [0, 0, 0, 0, -1]],
  ];
  for (const [position, expected] of cases) {
    expected.forEach((points, conceded) => {
      assert.equal(getGoalsConcededFantasyPoints(position, conceded), points);
    });
  }
  assert.throws(() => getGoalsConcededFantasyPoints("GK", -1), RangeError);
  assert.throws(() => getGoalsConcededFantasyPoints("GK", 1.5), RangeError);
});

test("conceded goals count only during participation window", () => {
  const goalMinutes = [20, 55, 80];
  assert.equal(countGoalsConcededOnField(goalMinutes, 0, 60), 2);
  assert.equal(getGoalsConcededFantasyPoints("CB", 2), -1);
  assert.equal(countGoalsConcededOnField(goalMinutes, 60, 90), 1);
  assert.equal(getGoalsConcededFantasyPoints("CB", 1), 0);
  assert.equal(countGoalsConcededOnField(goalMinutes, 0, 90), 3);
  assert.equal(countGoalsConcededOnField(goalMinutes, 60, 60), 0);
  assert.throws(() => countGoalsConcededOnField(goalMinutes, 70, 60), RangeError);
});

test("player fantasy score includes conceded goals and captain doubles the penalty", () => {
  const defender = calculateFantasyPlayerPoints(createPlayerInput({
    position: "CB", minutes_played: 90, starter: true,
    goals_conceded_on_field: 3,
  }));
  assert.equal(defender.breakdown.goals_conceded, -1);
  assert.equal(defender.points, 2); // 3 minutos, -1 encajados
  assert.equal(getFantasyCaptainBonus([defender], defender.player_id), 2);

  const keeper = calculateFantasyPlayerPoints(createPlayerInput({
    position: "GK", minutes_played: 90, starter: true,
    goals_conceded_on_field: 3,
  }));
  assert.equal(keeper.breakdown.goals_conceded, -3);
  assert.equal(keeper.points, 0);

  const unavailable = calculateFantasyPlayerPoints(createPlayerInput({
    position: "CB", minutes_played: 90,
    goals_conceded_on_field: null,
  }));
  assert.equal(unavailable.breakdown.goals_conceded, 0);
  assert.equal(unavailable.points, 3);

  const nonParticipant = calculateFantasyPlayerPoints(createPlayerInput({
    position: "GK", goals_conceded_on_field: 7,
  }));
  assert.equal(nonParticipant.breakdown.goals_conceded, 0);
  assert.equal(nonParticipant.points, 0);
  assert.throws(() => calculateFantasyPlayerPoints(createPlayerInput({
    minutes_played: 90, goals_conceded_on_field: -1,
  })), RangeError);
});

const matchForConceded = {
  home_team_id: "home", away_team_id: "away",
  home_score: 0, away_score: 3, match_minutes: 90,
};
const participant = (player_id, overrides = {}) => ({
  player_id, team_id: "home", starter: true,
  minutes_played: 90, entered_minute: 0,
  dismissal_minute: null, red_cards: 0, ...overrides,
});
const event = (event_type, minute, extra = {}, order = 0) => ({
  id: String(order), event_type, minute,
  player_id: null, secondary_player_id: null,
  scoring_team_id: null, created_at: `2026-10-20T12:${String(order).padStart(2,"0")}:00Z`,
  ...extra,
});
const concedingGoal = (minute, order) =>
  event("goal", minute, {scoring_team_id: "away"}, order);

test("chronological goals: substituted defender concedes two, substitute one", () => {
  const squad = [
    participant("starter", {minutes_played:60}),
    participant("sub", {starter:false, minutes_played:30, entered_minute:60}),
  ];
  const timeline = [
    concedingGoal(20, 1),
    concedingGoal(55, 2),
    event("substitution", 60, {player_id:"starter",secondary_player_id:"sub"},3),
    concedingGoal(80, 4),
  ];
  const conceded = getMatchGoalsConcededOnField(matchForConceded, squad, timeline);
  assert.equal(conceded?.get("starter"), 2);
  assert.equal(conceded?.get("sub"), 1);
  assert.equal(getGoalsConcededFantasyPoints("CB", conceded.get("starter")), -1);
  assert.equal(getGoalsConcededFantasyPoints("CB", conceded.get("sub")), 0);
});

test("dismissal stops conceded-goal counting, full-match starter counts all", () => {
  const squad = [
    participant("sent-off", {minutes_played:60, red_cards:1, dismissal_minute:60}),
    participant("stays"),
  ];
  const events = [
    concedingGoal(20,1),concedingGoal(55,2),
    event("red_card",60,{player_id:"sent-off"},3),
    concedingGoal(80,4),
  ];
  const conceded = getMatchGoalsConcededOnField(matchForConceded,squad,events);
  assert.equal(conceded?.get("sent-off"),2);
  assert.equal(conceded?.get("stays"),3);
});

test("own goal counts for the team whose scoreboard rises", () => {
  const squad = [participant("p")];
  const timeline = [
    event("goal",20,{scoring_team_id:"away",player_id:"p"},1),
    concedingGoal(55,2),concedingGoal(80,3),
  ];
  const conceded = getMatchGoalsConcededOnField(matchForConceded,squad,timeline);
  assert.equal(conceded?.get("p"),3);
});

test("same-minute substitutions respect chronological insertion order", () => {
  const match = {...matchForConceded, away_score:1};
  const squad = [
    participant("starter",{minutes_played:60}),
    participant("sub",{starter:false,minutes_played:30,entered_minute:60}),
  ];
  const events = [
    event("substitution",60,{player_id:"starter",secondary_player_id:"sub"},1),
    concedingGoal(60,2),
  ];
  const conceded = getMatchGoalsConcededOnField(match,squad,events);
  assert.equal(conceded?.get("starter"),0);
  assert.equal(conceded?.get("sub"),1);
});

test("incomplete goals or unknown participation never produce speculative penalties", () => {
  const match = {...matchForConceded, away_score:2};
  assert.equal(
    getMatchGoalsConcededOnField(match,[participant("p")],[concedingGoal(20,1)]),
    null,
  );
  assert.equal(
    getMatchGoalsConcededOnField({...match,away_score:1},[
      participant("starter",{minutes_played:60}),
    ],[concedingGoal(20,1)]),
    null,
  );
  assert.equal(
    getMatchGoalsConcededOnField({...match,away_score:1},[
      participant("sub",{starter:false,minutes_played:30,entered_minute:60}),
    ],[concedingGoal(80,1)]),
    null,
  );
});
