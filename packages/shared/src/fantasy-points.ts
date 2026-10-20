import type {
  PlayerPosition,
} from "./domain";

import {
  getFantasyLine,
} from "./fantasy-lineup";

export const FANTASY_MVP_POINTS =
  2;

export type FantasyRedCardReason = "direct" | "second_yellow";

export type FantasyPlayerPointsInput = {
  player_id: string;

  position: PlayerPosition;

  minutes_played: number;

  goals: number;

  assists: number;

  yellow_cards: number;

  red_cards: number;

  red_card_reason?: FantasyRedCardReason | null;

  clean_sheet: boolean;

  starter: boolean;

  match_minutes: number;

  /** null: cronología incompleta, no se aplica penalización estimada. */
  goals_conceded_on_field?: number | null;

  panel_rating: number | null;

  is_mvp: boolean;
};

export type FantasyPlayerPointsBreakdown = {
  minutes: number;

  goals: number;

  assists: number;

  clean_sheet: number;

  goals_conceded: number;

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

/**
 * Penalización por goles recibidos durante los minutos en campo.
 * La capa de eventos debe entregar exclusivamente los goles
 * encajados mientras el jugador participaba en el encuentro.
 */
export function getGoalsConcededFantasyPoints(
  position: PlayerPosition,
  goalsConcededOnField: number,
): number {
  if (!validateNonNegativeInteger(goalsConcededOnField)) {
    throw new RangeError("Goles encajados no válidos.");
  }
  const goalsPerPenalty: Record<
    ReturnType<typeof getFantasyLine>,
    number
  > = {
    GK: 1,
    DEF: 2,
    MID: 3,
    FWD: 4,
  };
  const penaltyGroups = Math.floor(
    goalsConcededOnField / goalsPerPenalty[getFantasyLine(position)],
  );
  return penaltyGroups === 0 ? 0 : -penaltyGroups;
}

/**
 * El minuto de entrada cuenta; el de salida no.
 * Minutos iguales requieren orden cronológico de eventos
 * antes de utilizar esta función.
 */
export function countGoalsConcededOnField(
  goalMinutes: readonly number[],
  enteredMinute: number,
  exitedMinute: number,
): number {
  if (
    !validateNonNegativeInteger(enteredMinute) ||
    !validateNonNegativeInteger(exitedMinute) ||
    exitedMinute < enteredMinute ||
    goalMinutes.some((minute) => !validateNonNegativeInteger(minute))
  ) {
    throw new RangeError("Cronología del partido no válida.");
  }
  return goalMinutes.filter(
    (minute) => minute >= enteredMinute && minute < exitedMinute,
  ).length;
}

export function getCardsFantasyPoints(
  yellowCards: number,
  redCards: number,
  redCardReason: FantasyRedCardReason | null = null,
): number {
  const yellowPenalty = yellowCards * -2;

  if (redCards === 0) return yellowPenalty;
  if (redCardReason === "direct") return yellowPenalty + redCards * -5;
  if (redCardReason === "second_yellow" && yellowCards >= 2) {
    return yellowPenalty + Math.max(0, redCards - 1) * -5;
  }

  // Compatibilidad provisional con registros historicos sin motivo.
  const presumedSecondYellow = Math.min(redCards, Math.floor(yellowCards / 2));
  return yellowPenalty + (redCards - presumedSecondYellow) * -5;
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
    ...(input.goals_conceded_on_field == null ? [] : [input.goals_conceded_on_field]),
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

  // Un jugador que no disputó ningún minuto no puntúa,
  // aunque existan valoraciones o estadísticas asociadas.
  if (input.minutes_played === 0) {
    return {
      player_id: input.player_id,
      points: 0,
      rateable: false,
      rounded_rating: null,
      breakdown: {
        minutes: 0,
        goals: 0,
        assists: 0,
        clean_sheet: 0,
        goals_conceded: 0,
        cards: 0,
        rating: 0,
        mvp: 0,
      },
    };
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

  const concededPoints = input.goals_conceded_on_field == null
    ? 0
    : getGoalsConcededFantasyPoints(input.position, input.goals_conceded_on_field);

  const cardsPoints =
    getCardsFantasyPoints(
      input.yellow_cards,
      input.red_cards,
      input.red_card_reason ?? null,
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

    goals_conceded: concededPoints,

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
    breakdown.goals_conceded +
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
/**
 * Bonus exclusivo del XI Fantasy: un capitán aporta su
 * puntuación final una segunda vez, también si es negativa.
 */
export function getFantasyCaptainBonus(
  players: readonly FantasyPlayerPointsResult[],
  captainPlayerId: string | null,
): number {
  if (!captainPlayerId) {
    return 0;
  }

  return players.find(
    (player) => player.player_id === captainPlayerId,
  )?.points ?? 0;
}
