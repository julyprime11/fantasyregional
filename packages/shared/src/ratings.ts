import type {
  PlayerPosition,
} from "./domain";

export interface RatingConfig {
  minimumVotes: number;

  roleWeights: Readonly<
    Record<
      string,
      number
    >
  >;
}

export const DEFAULT_RATING_CONFIG: Readonly<RatingConfig> =
  Object.freeze({
    minimumVotes:
      1,

    roleWeights:
      Object.freeze({
        jugador:
          0.2,

        directiva:
          0.3,

        entrenador:
          0.5,

        cuerpo_tecnico:
          0.5,
      }),
  });

export type ResultsPhase =
  | "provisional"
  | "final";

export function getResultsPhase(
  matchStatus: string,
): ResultsPhase | null {
  if (
    matchStatus ===
    "voting"
  ) {
    return "provisional";
  }

  if (
    matchStatus ===
    "closed"
  ) {
    return "final";
  }

  return null;
}

export interface PanelVote {
  score: number;
  voter_role: string;
}

export interface PlayerRatingInput {
  player_id: string;

  position:
    | PlayerPosition
    | null;

  minutes_played:
    number;

  goals:
    number;

  assists:
    number;

  yellow_cards:
    number;

  red_cards:
    number;

  clean_sheet:
    boolean;

  votes:
    readonly PanelVote[];
}

export type RatingGroupKey =
  | "players"
  | "directors"
  | "coaches";

export type RatingGroupSummary = {
  vote_count: number;
  average: number | null;
  configured_weight: number;
  applied_weight: number;
};

export type RatingBreakdown = {
  players: RatingGroupSummary;
  directors: RatingGroupSummary;
  coaches: RatingGroupSummary;
};

interface RatingDetails {
  player_id: string;

  panel_average:
    number | null;

  statistical_score:
    number | null;

  vote_count:
    number;

  rounded_rating:
    number | null;

  groups:
    RatingBreakdown;
}

export type RatedPlayer =
  RatingDetails & {
    status:
      "rated";

    reason:
      null;

    final_rating:
      number;
  };

export type PlayerRatingResult =
  | RatedPlayer
  | (
      RatingDetails & {
        status:
          | "no_minutes"
          | "insufficient_votes"
          | "invalid_data";

        reason:
          string;

        final_rating:
          null;
      }
    );

export type MatchMvpResult = {
  status:
    | "none"
    | "single"
    | "shared";

  players:
    RatedPlayer[];

  final_rating:
    number | null;
};

function getVoteGroup(
  role: string,
): RatingGroupKey | null {
  switch (
    role
      .trim()
      .toLowerCase()
  ) {
    case "jugador":
case "player":
  return "players";

    case "directiva":
      return "directors";

    case "entrenador":
    case "cuerpo_tecnico":
      return "coaches";

    default:
      return null;
  }
}

function average(
  values: readonly number[],
): number | null {
  if (
    values.length ===
    0
  ) {
    return null;
  }

  const total =
    values.reduce(
      (
        sum,
        value,
      ) =>
        sum +
        value,
      0,
    );

  return (
    total /
    values.length
  );
}

function createEmptyGroups(): RatingBreakdown {
  return {
    players: {
      vote_count:
        0,

      average:
        null,

      configured_weight:
        0.2,

      applied_weight:
        0,
    },

    directors: {
      vote_count:
        0,

      average:
        null,

      configured_weight:
        0.3,

      applied_weight:
        0,
    },

    coaches: {
      vote_count:
        0,

      average:
        null,

      configured_weight:
        0.5,

      applied_weight:
        0,
    },
  };
}

/*
 * Calcula únicamente la valoración
 * humana del jugador.
 *
 * Primero:
 * - media jugadores
 * - media directivos
 * - media entrenadores/cuerpo técnico
 *
 * Después redistribuye proporcionalmente
 * los pesos cuando algún colectivo no
 * haya votado.
 */
export function calculatePanelRating(
  votes: readonly PanelVote[],
): {
  panel_average: number | null;
  rounded_rating: number | null;
  vote_count: number;
  groups: RatingBreakdown;
} {
  const groups =
    createEmptyGroups();

  const groupedScores: Record<
    RatingGroupKey,
    number[]
  > = {
    players: [],
    directors: [],
    coaches: [],
  };

  for (
    const vote of
    votes
  ) {
    if (
      !Number.isFinite(
        vote.score,
      ) ||
      vote.score < 0 ||
      vote.score > 10
    ) {
      return {
        panel_average:
          null,

        rounded_rating:
          null,

        vote_count:
          votes.length,

        groups,
      };
    }

    const group =
      getVoteGroup(
        vote.voter_role,
      );

    if (!group) {
      continue;
    }

    groupedScores[
      group
    ].push(
      vote.score,
    );
  }

  groups.players.vote_count =
    groupedScores.players.length;

  groups.players.average =
    average(
      groupedScores.players,
    );

  groups.directors.vote_count =
    groupedScores.directors.length;

  groups.directors.average =
    average(
      groupedScores.directors,
    );

  groups.coaches.vote_count =
    groupedScores.coaches.length;

  groups.coaches.average =
    average(
      groupedScores.coaches,
    );

  const activeGroups: RatingGroupKey[] =
    (
      [
        "players",
        "directors",
        "coaches",
      ] as const
    ).filter(
      (group) =>
        groups[group]
          .average !==
        null,
    );

  if (
    activeGroups.length ===
    0
  ) {
    return {
      panel_average:
        null,

      rounded_rating:
        null,

      vote_count:
        0,

      groups,
    };
  }

  const totalConfiguredWeight =
    activeGroups.reduce(
      (
        total,
        group,
      ) =>
        total +
        groups[group]
          .configured_weight,
      0,
    );

  let weightedTotal =
    0;

  for (
    const group of
    activeGroups
  ) {
    const appliedWeight =
      groups[group]
        .configured_weight /
      totalConfiguredWeight;

    groups[group].applied_weight =
      appliedWeight;

    weightedTotal +=
      groups[group]
        .average! *
      appliedWeight;
  }

  return {
    panel_average:
      weightedTotal,

    rounded_rating:
      Math.round(
        weightedTotal,
      ),

    vote_count:
      activeGroups.reduce(
        (
          total,
          group,
        ) =>
          total +
          groups[group]
            .vote_count,
        0,
      ),

    groups,
  };
}

export function calculatePlayerRating(
  input: PlayerRatingInput,
  config: Partial<RatingConfig> =
    DEFAULT_RATING_CONFIG,
): PlayerRatingResult {
  const minimumVotes =
    config.minimumVotes ??
    DEFAULT_RATING_CONFIG.minimumVotes;

  if (
    !Number.isSafeInteger(
      minimumVotes,
    ) ||
    minimumVotes <
      1
  ) {
    throw new RangeError(
      "minimumVotes must be a positive integer.",
    );
  }

  const panel =
    calculatePanelRating(
      input.votes,
    );

  const details: RatingDetails = {
    player_id:
      input.player_id,

    panel_average:
      panel.panel_average,

    statistical_score:
      null,

    vote_count:
      panel.vote_count,

    rounded_rating:
      panel.rounded_rating,

    groups:
      panel.groups,
  };

  const counts = [
    input.minutes_played,
    input.goals,
    input.assists,
    input.yellow_cards,
    input.red_cards,
  ];

  if (
    !input.player_id ||
    counts.some(
      (value) =>
        !Number.isSafeInteger(
          value,
        ) ||
        value < 0,
    ) ||
    typeof input.clean_sheet !==
      "boolean"
  ) {
    return {
      ...details,

      status:
        "invalid_data",

      reason:
        "Datos de posición, estadísticas o votos no válidos.",

      final_rating:
        null,
    };
  }

  if (
    input.minutes_played ===
    0
  ) {
    return {
      ...details,

      status:
        "no_minutes",

      reason:
        "Sin minutos jugados.",

      final_rating:
        null,
    };
  }

  if (
    panel.panel_average ===
      null ||
    panel.vote_count <
      minimumVotes
  ) {
    return {
      ...details,

      status:
        "insufficient_votes",

      reason:
        `Votos insuficientes: ${panel.vote_count} de ${minimumVotes} requeridos.`,

      final_rating:
        null,
    };
  }

  return {
    ...details,

    status:
      "rated",

    reason:
      null,

    final_rating:
      panel.panel_average,
  };
}

export function selectMatchMvp(
  results: readonly PlayerRatingResult[],
): MatchMvpResult {
  let best:
    RatedPlayer[] = [];

  for (
    const result of
    results
  ) {
    if (
      result.status !==
      "rated"
    ) {
      continue;
    }

    if (
      best.length ===
        0 ||
      result.final_rating >
        best[0].final_rating
    ) {
      best = [
        result,
      ];
    } else if (
      result.final_rating ===
      best[0].final_rating
    ) {
      best.push(
        result,
      );
    }
  }

  best.sort(
    (
      a,
      b,
    ) =>
      a.player_id <
      b.player_id
        ? -1
        : a.player_id >
            b.player_id
          ? 1
          : 0,
  );

  return {
    status:
      best.length ===
      0
        ? "none"
        : best.length ===
            1
          ? "single"
          : "shared",

    players:
      best,

    final_rating:
      best[0]
        ?.final_rating ??
      null,
  };
}

/*
 * Se mantiene por compatibilidad
 * con imports anteriores.
 *
 * Ya no participa en el cálculo
 * Fantasy nuevo.
 */
export function minutesCoefficient(
  minutes: number,
): number {
  if (
    minutes <= 0
  ) {
    return 0;
  }

  if (
    minutes < 10
  ) {
    return 0.1;
  }

  if (
    minutes < 30
  ) {
    return 0.4;
  }

  if (
    minutes < 60
  ) {
    return 0.7;
  }

  return 1;
}