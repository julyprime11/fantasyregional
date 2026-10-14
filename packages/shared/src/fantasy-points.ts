import type {
  PlayerPosition,
} from "./domain";

import {
  getFantasyLine,
} from "./fantasy-lineup";

export const FANTASY_MVP_POINTS =
  2;

export type FantasyPlayerPointsInput = {
  player_id: string;

  position: PlayerPosition;

  minutes_played: number;

  goals: number;

  assists: number;

  yellow_cards: number;

  red_cards: number;

  clean_sheet: boolean;

  starter: boolean;

  match_minutes: number;

  panel_rating: number | null;

  is_mvp: boolean;
};

export type FantasyPlayerPointsBreakdown = {
  minutes: number;

  goals: number;

  assists: number;

  clean_sheet: number;

  cards: number;

  rating: number;

  mvp: number;
};

export type FantasyPlayerPointsResult = {
  player_id: string;

  points: number;

  rateable: boolean;

  rounded_rating: number | null;

  breakdown: FantasyPlayerPointsBreakdown;
};

export type FantasyLineupPointsResult = {
  players: FantasyPlayerPointsResult[];

  total_points: number;
};

function validateNonNegativeInteger(
  value: number,
): boolean {
  return (
    Number.isSafeInteger(
      value,
    ) &&
    value >= 0
  );
}

export function getMinutesFantasyPoints(
  minutes: number,
): number {
  if (minutes < 10) {
    return 0;
  }

  if (minutes < 30) {
    return 1;
  }

  if (minutes < 60) {
    return 2;
  }

  return 3;
}

export function getGoalFantasyPoints(
  position: PlayerPosition,
): number {
  const line =
    getFantasyLine(
      position,
    );

  switch (line) {
    case "GK":
      return 10;

    case "DEF":
      return 6;

    case "MID":
      return 5;

    case "FWD":
      return 4;

    default:
      return 0;
  }
}

export function getCleanSheetFantasyPoints(
  position: PlayerPosition,
  minutesPlayed: number,
  matchMinutes: number,
  starter: boolean,
  cleanSheet: boolean,
): number {
  if (!cleanSheet) {
    return 0;
  }

  const line =
    getFantasyLine(
      position,
    );

  switch (line) {
    case "GK":
      return (
        starter &&
        matchMinutes > 0 &&
        minutesPlayed >= matchMinutes
      )
        ? 4
        : 0;

    case "DEF":
      return 3;

    case "MID":
      return 2;

    case "FWD":
      return 1;

    default:
      return 0;
  }
}

export function getCardsFantasyPoints(
  yellowCards: number,
  redCards: number,
): number {
  /*
   * La expulsión por doble amarilla ya supone -4
   * por las dos tarjetas. No se añade otra
   * penalización por la roja registrada.
   *
   * Si se registra una roja con menos de
   * dos amarillas, se considera roja directa:
   * -5 por roja y -2 por cada amarilla previa.
   *
   * Match Admin aún no distingue explícitamente
   * el motivo de expulsión; esta interpretación
   * conserva la estructura actual de datos.
   */
  const secondYellowDismissals =
    Math.min(redCards, Math.floor(yellowCards / 2));

  const directReds =
    redCards - secondYellowDismissals;

  return yellowCards * -2 + directReds * -5;
}

export function getRatingFantasyPoints(
  panelRating: number | null,
): {
  points: number;
  rounded_rating: number | null;
  rateable: boolean;
} {
  if (
    panelRating === null ||
    !Number.isFinite(
      panelRating,
    )
  ) {
    return {
      points: 0,
      rounded_rating: null,
      rateable: false,
    };
  }

  const rounded =
    Math.min(
      10,
      Math.max(
        0,
        Math.round(
          panelRating,
        ),
      ),
    );

  let points: number;

  if (rounded <= 2) {
    points = -2;
  } else if (rounded <= 4) {
    points = -1;
  } else if (rounded === 5) {
    points = 0;
  } else if (rounded <= 7) {
    points = 1;
  } else if (rounded <= 9) {
    points = 2;
  } else {
    points = 3;
  }

  return {
    points,
    rounded_rating:
      rounded,
    rateable: true,
  };
}

export function calculateFantasyPlayerPoints(
  input: FantasyPlayerPointsInput,
): FantasyPlayerPointsResult {
  const numericValues = [
    input.minutes_played,
    input.goals,
    input.assists,
    input.yellow_cards,
    input.red_cards,
    input.match_minutes,
  ];

  if (
    !input.player_id ||
    numericValues.some(
      (value) =>
        !validateNonNegativeInteger(
          value,
        ),
    )
  ) {
    throw new RangeError(
      "Datos Fantasy no válidos.",
    );
  }

  const minutesPoints =
    getMinutesFantasyPoints(
      input.minutes_played,
    );

  const goalPoints =
    input.goals *
    getGoalFantasyPoints(
      input.position,
    );

  const assistPoints =
    input.assists *
    3;

  const cleanSheetPoints =
    getCleanSheetFantasyPoints(
      input.position,
      input.minutes_played,
      input.match_minutes,
      input.starter,
      input.clean_sheet,
    );

  const cardsPoints =
    getCardsFantasyPoints(
      input.yellow_cards,
      input.red_cards,
    );

  const rating =
    getRatingFantasyPoints(
      input.panel_rating,
    );

  const mvpPoints =
    input.is_mvp
      ? FANTASY_MVP_POINTS
      : 0;

  const breakdown: FantasyPlayerPointsBreakdown = {
    minutes:
      minutesPoints,

    goals:
      goalPoints,

    assists:
      assistPoints,

    clean_sheet:
      cleanSheetPoints,

    cards:
      cardsPoints,

    rating:
      rating.points,

    mvp:
      mvpPoints,
  };

  const points =
    breakdown.minutes +
    breakdown.goals +
    breakdown.assists +
    breakdown.clean_sheet +
    breakdown.cards +
    breakdown.rating +
    breakdown.mvp;

  return {
    player_id:
      input.player_id,

    points,

    rateable:
      rating.rateable,

    rounded_rating:
      rating.rounded_rating,

    breakdown,
  };
}

export function calculateFantasyLineupPoints(
  players: readonly FantasyPlayerPointsInput[],
): FantasyLineupPointsResult {
  const results =
    players.map(
      calculateFantasyPlayerPoints,
    );

  const totalPoints =
    results.reduce(
      (
        total,
        player,
      ) =>
        total +
        player.points,
      0,
    );

  return {
    players:
      results,

    total_points:
      totalPoints,
  };
}