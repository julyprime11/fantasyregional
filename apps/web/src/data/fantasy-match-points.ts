import "server-only";

import {
  calculateFantasyLineupPoints,
  type FantasyPlayerPointsResult,
} from "@regional-fantasy/shared";

import {
  getFantasyLineup,
  getFantasyLineupPlayers,
} from "./fantasy-lineups";

import { getMatchResults } from "./match-results";

export type FantasyMatchPlayerPoints = {
  player_id: string;
  player_name: string;
  shirt_number: number | null;
  position: string | null;

  starter: boolean;
  minutes_played: number;

  final_rating: number | null;
  points: number;
  rateable: boolean;
};

export type FantasyMatchPointsResult =
  | {
      status: "not_found";
    }
  | {
      status: "not_ready";
      reason: string;
    }
  | {
      status: "ready";
      total_points: number;
      players: FantasyMatchPlayerPoints[];
    };

export async function getFantasyMatchPoints(input: {
  leagueId: string;
  userId: string;
  matchId: string;
}): Promise<FantasyMatchPointsResult> {
  const lineup =
    await getFantasyLineup({
      leagueId: input.leagueId,
      userId: input.userId,
      matchId: input.matchId,
    });

  if (!lineup) {
    return {
      status: "not_found",
    };
  }

  const lineupPlayers =
    await getFantasyLineupPlayers(
      lineup.id,
    );

  const results =
    await getMatchResults(
      input.matchId,
    );

  if (
    results.status !== "ready" ||
    results.phase !== "final"
  ) {
    return {
      status: "not_ready",
      reason:
        "Los puntos Fantasy todavía no están disponibles porque el partido no tiene resultados finales.",
    };
  }

  const ratingByPlayer =
    new Map(
      results.rows.map(
        (row) => [
          row.entry.player_id,
          row.rating.final_rating,
        ],
      ),
    );

  const starterByPlayer =
    new Map(
      results.rows.map(
        (row) => [
          row.entry.player_id,
          row.entry.starter,
        ],
      ),
    );

  const minutesByPlayer =
    new Map(
      results.rows.map(
        (row) => [
          row.entry.player_id,
          row.entry.minutes_played,
        ],
      ),
    );

  const fantasy =
    calculateFantasyLineupPoints(
      lineupPlayers.map(
        (entry) => ({
          player_id:
            entry.player_id,

          final_rating:
            ratingByPlayer.get(
              entry.player_id,
            ) ?? null,
        }),
      ),
    );

  const pointsByPlayer =
    new Map<
      string,
      FantasyPlayerPointsResult
    >(
      fantasy.players.map(
        (player) => [
          player.player_id,
          player,
        ],
      ),
    );

  const players =
    lineupPlayers.map(
      (entry) => {
        const playerPoints =
          pointsByPlayer.get(
            entry.player_id,
          );

        const playerName =
          entry.player
            ? `${entry.player.first_name} ${
                entry.player.last_name ?? ""
              }`.trim()
            : "Jugador no disponible";

        return {
          player_id:
            entry.player_id,

          player_name:
            playerName,

          shirt_number:
            entry.player
              ?.shirt_number ??
            null,

          position:
            entry.player
              ?.position ??
            null,

          starter:
            starterByPlayer.get(
              entry.player_id,
            ) ?? false,

          minutes_played:
            minutesByPlayer.get(
              entry.player_id,
            ) ?? 0,

          final_rating:
            ratingByPlayer.get(
              entry.player_id,
            ) ?? null,

          points:
            playerPoints?.points ??
            0,

          rateable:
            playerPoints
              ?.rateable ??
            false,
        };
      },
    );

  /*
   * Aquí no ordenamos por puntos porque en la
   * pantalla de jornada vamos a separar después
   * titulares y banquillo.
   */
  return {
    status: "ready",
    total_points:
      fantasy.total_points,
    players,
  };
}