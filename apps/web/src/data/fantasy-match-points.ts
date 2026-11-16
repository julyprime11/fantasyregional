import "server-only";

import type { FantasyPlayerPointsResult } from "@regional-fantasy/shared";

import {
  getFantasyLineup,
  getFantasyLineupPlayers,
} from "./fantasy-lineups";

import {
  getMatchResults,
} from "./match-results";

export type FantasyMatchPlayerPoints = {
  player_id: string;

  player_name: string;

  shirt_number:
    number | null;

  position:
    string | null;

  starter:
    boolean;

  minutes_played:
    number;

  /*
   * Conservamos este nombre para no
   * romper pantallas existentes.
   *
   * Ahora representa la valoración
   * ponderada del panel.
   */
  final_rating:
    number | null;

  rounded_rating:
    number | null;

  points: number;
  base_points: number;
  captain_bonus: number;
  is_captain: boolean;
  rateable:
    boolean;

  breakdown: FantasyPlayerPointsResult["breakdown"];
};

export type FantasyMatchPointsResult =
  | {
      status:
        "not_found";
    }
  | {
      status:
        "not_ready";

      reason:
        string;
    }
  | {
      status:
        "ready";

      total_points:
        number;

      players:
        FantasyMatchPlayerPoints[];
    };

export async function getFantasyMatchPoints(
  input: {
    leagueId:
      string;

    userId:
      string;

    matchId:
      string;
  },
): Promise<FantasyMatchPointsResult> {
  const lineup =
    await getFantasyLineup({
      leagueId:
        input.leagueId,

      userId:
        input.userId,

      matchId:
        input.matchId,
    });

  if (!lineup) {
    return {
      status:
        "not_found",
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
    results.status !==
      "ready" ||
    results.phase !==
      "final"
  ) {
    return {
      status:
        "not_ready",

      reason:
        "Los puntos Fantasy todavía no están disponibles porque el partido no tiene resultados finales.",
    };
  }

  /*
   * Índice de resultados reales
   * por jugador.
   */
  const resultByPlayer =
    new Map(
      results.rows.map(
        (
          row,
        ) => [
          row.entry.player_id,
          row,
        ],
      ),
    );

  // La puntuación Fantasy es global por jugador y partido: Match Admin
  // ya calculó V3, valoración y MVP. Las ligas no la recalculan.

  const players =
    lineupPlayers.map(
      (
        entry,
      ) => {
        const result =
          resultByPlayer.get(
            entry.player_id,
          );

        const playerPoints =
          result?.fantasy ?? null;

        const playerName =
          entry.player
            ? `${entry.player.first_name} ${
                entry.player.last_name ??
                ""
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
            result?.entry
              .starter ??
            false,

          minutes_played:
            result?.entry
              .minutes_played ??
            0,

          final_rating:
            result?.rating
              .final_rating ??
            null,

          rounded_rating:
            playerPoints
              ?.rounded_rating ??
            null,

          points:
            (playerPoints?.points ?? 0) *
            (lineup.captain_player_id === entry.player_id ? 2 : 1),
          base_points: playerPoints?.points ?? 0,
          captain_bonus: lineup.captain_player_id === entry.player_id
            ? (playerPoints?.points ?? 0)
            : 0,
          is_captain: lineup.captain_player_id === entry.player_id,
          rateable:
            playerPoints
              ?.rateable ??
            false,

          breakdown:
            playerPoints
              ?.breakdown ?? {
              minutes:
                0,

              goals:
                0,

              assists:
                0,

              clean_sheet:
                0,

              goals_conceded: 0,

              cards:
                0,

               extra_stats:
                 0,

              rating:
                0,

              mvp:
                0,
            },
        };
      },
    );

  return {
    status:
      "ready",

    // La puntuación de liga suma los puntos globales del XI,
     // aplicando el bonus solo al capitán seleccionado.
     total_points: players.reduce((sum, player) => sum + player.points, 0),

    players,
  };
}