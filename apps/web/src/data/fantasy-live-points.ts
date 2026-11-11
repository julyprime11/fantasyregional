import "server-only";

import {
  calculateProvisionalFantasyPlayerPoints,
  getFantasyLiveMatchMinute,
  getFantasyLivePlayedMinutes,
  getMatchGoalsConcededOnField,
  getFantasyMatchScoringTeamId,
  PLAYER_POSITIONS,
  type FantasyPlayerPointsResult,
  type FantasyScoringVersion,
  type PlayerPosition,
} from "@regional-fantasy/shared";

import type { MatchRow } from "./matches";
import type { MatchPlayerDetails } from "./match-players";
import type { MatchEvent } from "./match-events";

export type FantasyLivePlayerPoints = {
  pointsByPlayerId: Map<string, FantasyPlayerPointsResult>;
  currentMinute: number;
  goalsConcededVerified: boolean;
  goalsConcededPending: boolean;
};

/**
 * Vista provisional: una única puntuación global por jugador/partido.
 * No lee votos, no anticipa rating, MVP ni portería a cero definitiva.
 *
 * Utiliza el cálculo oficial de shared y la cronología oficial de goles.
 * Cuando no se puede reconstruir una penalización por goles encajados,
 * se omite en lugar de inventarla y la UI advierte que está pendiente.
 */
export function calculateFantasyLivePoints({
  match,
  squad,
  events,
  now,
}: {
  match: MatchRow;
  squad: readonly MatchPlayerDetails[];
  events: readonly MatchEvent[];
  now: number;
}): FantasyLivePlayerPoints {
  const version = match.fantasy_scoring_version;
  if (version !== "v1" && version !== "v2" && version !== "v3") {
    throw new Error("Versión Fantasy del partido no válida.");
  }
  const scoringVersion: FantasyScoringVersion = version;

  const minute = getFantasyLiveMatchMinute(match, now);
  const matchMinutes = Math.max(
    minute,
    ...squad.map((entry) => entry.minutes_played),
    0,
  );

  const minutes = new Map(
    squad.map((entry) => [
      entry.player_id,
      getFantasyLivePlayedMinutes(entry, minute),
    ]),
  );

  // La atribucion de goles es identica a la del marcador en directo.
  const teamByPlayer = new Map(squad.map((entry) => [entry.player_id, entry.team_id]));
  const resolvedEvents = events.map((event) => ({
    ...event,
    scoring_team_id: getFantasyMatchScoringTeamId(
      event,
      teamByPlayer,
      match.home_team_id,
      match.away_team_id,
    ),
  }));

  const homeGoals = resolvedEvents.filter(
    (event) => event.event_type === "goal" && event.scoring_team_id === match.home_team_id,
  ).length;
  const awayGoals = resolvedEvents.filter(
    (event) => event.event_type === "goal" && event.scoring_team_id === match.away_team_id,
  ).length;

  const conceded = getMatchGoalsConcededOnField(
    {
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      home_score: match.status === "finished" && match.home_score !== null
        ? match.home_score
        : homeGoals,
      away_score: match.status === "finished" && match.away_score !== null
        ? match.away_score
        : awayGoals,
      match_minutes: matchMinutes,
    },
    squad.map((entry) => ({
      player_id: entry.player_id,
      team_id: entry.team_id,
      starter: entry.starter,
      minutes_played: minutes.get(entry.player_id) ?? 0,
      entered_minute: entry.entered_minute,
      dismissal_minute: entry.dismissal_minute,
      red_cards: entry.red_cards,
    })),
    resolvedEvents,
  );

  const pointsByPlayerId = new Map<string, FantasyPlayerPointsResult>();

  for (const entry of squad) {
    const rawPosition = entry.player?.position;
    if (!rawPosition || !PLAYER_POSITIONS.includes(rawPosition as PlayerPosition)) {
      continue;
    }

    const playerId = entry.player_id;
    const playedMinutes = minutes.get(playerId) ?? 0;
    const scored = calculateProvisionalFantasyPlayerPoints({
      player_id: playerId,
      position: rawPosition as PlayerPosition,
      minutes_played: playedMinutes,
      goals: entry.goals,
      assists: entry.assists,
      yellow_cards: entry.yellow_cards,
      red_cards: entry.red_cards,
      red_card_reason:
        entry.red_card_reason === "direct" || entry.red_card_reason === "second_yellow"
          ? entry.red_card_reason
          : null,
      starter: entry.starter,
      match_minutes: matchMinutes,
      goals_conceded_on_field: conceded?.get(playerId) ?? null,
      scoring_version: scoringVersion,
      penalties_won: entry.penalties_won,
      penalties_conceded: entry.penalties_conceded,
      penalties_missed: entry.penalties_missed,
      penalties_saved: entry.penalties_saved,
      errors_leading_to_goal: entry.errors_leading_to_goal,
      errors_leading_to_chance: entry.errors_leading_to_chance,
      big_chances_missed: entry.big_chances_missed,
      own_goals: entry.own_goals,
    });

    pointsByPlayerId.set(playerId, scored);
  }

  // La ausencia de cronología no debe parecer una penalización confirmada.
  const goalsConcededPending =
    conceded === null &&
    squad.some((entry) => {
      const concededTeamGoals = entry.team_id === match.home_team_id
        ? awayGoals
        : entry.team_id === match.away_team_id
          ? homeGoals
          : 0;
      return concededTeamGoals > 0 && (minutes.get(entry.player_id) ?? 0) > 0;
    });

  return {
    pointsByPlayerId,
    currentMinute: minute,
    goalsConcededVerified: conceded !== null,
    goalsConcededPending,
  };
}
