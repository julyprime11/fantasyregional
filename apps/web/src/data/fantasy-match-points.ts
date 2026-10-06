import "server-only";

import {
  calculateFantasyLineupPoints,
  PLAYER_POSITIONS,
  type FantasyPlayerPointsResult,
  type PlayerPosition,
} from "@regional-fantasy/shared";

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

  points:
    number;

  rateable:
    boolean;

  breakdown: {
    minutes:
      number;

    goals:
      number;

    assists:
      number;

    clean_sheet:
      number;

    cards:
      number;

    rating:
      number;

    mvp:
      number;
  };
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

function toPlayerPosition(
  value:
    string | null | undefined,
): PlayerPosition | null {
  if (!value) {
    return null;
  }

  return PLAYER_POSITIONS.includes(
    value as PlayerPosition,
  )
    ? (
        value as PlayerPosition
      )
    : null;
}

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

  /*
   * Duración real aproximada del partido:
   * usamos el mayor número de minutos
   * registrado entre todos los participantes.
   *
   * Esto permite aplicar correctamente
   * la regla del portero que debe disputar
   * todo el encuentro.
   */
  const matchMinutes =
    Math.max(
      0,
      ...results.rows.map(
        (
          row,
        ) =>
          row.entry.minutes_played,
      ),
    );

  /*
   * El MVP se obtiene del mismo resultado
   * oficial calculado para el partido.
   *
   * Si existe MVP compartido, todos los
   * jugadores incluidos reciben el bonus.
   */
  const mvpPlayerIds =
    new Set(
      results.mvp.players.map(
        (
          player,
        ) =>
          player.player_id,
      ),
    );

  const fantasyInputs =
    lineupPlayers
      .map(
        (
          lineupEntry,
        ) => {
          const result =
            resultByPlayer.get(
              lineupEntry.player_id,
            );

          if (!result) {
            return null;
          }

          const position =
            toPlayerPosition(
              result.entry.player
                ?.position ??
                lineupEntry.player
                  ?.position ??
                null,
            );

          if (!position) {
            return null;
          }

          return {
            player_id:
              lineupEntry.player_id,

            position,

            minutes_played:
              result.entry
                .minutes_played,

            goals:
              result.entry
                .goals,

            assists:
              result.entry
                .assists,

            yellow_cards:
              result.entry
                .yellow_cards,

            red_cards:
              result.entry
                .red_cards,

            clean_sheet:
              result.entry
                .clean_sheet,

            starter:
              result.entry
                .starter,

            match_minutes:
              matchMinutes,

            panel_rating:
              result.rating
                .final_rating,

            is_mvp:
              mvpPlayerIds.has(
                lineupEntry.player_id,
              ),
          };
        },
      )
      .filter(
        (
          entry,
        ): entry is NonNullable<
          typeof entry
        > =>
          entry !== null,
      );

  const fantasy =
    calculateFantasyLineupPoints(
      fantasyInputs,
    );

  const pointsByPlayer =
    new Map<
      string,
      FantasyPlayerPointsResult
    >(
      fantasy.players.map(
        (
          player,
        ) => [
          player.player_id,
          player,
        ],
      ),
    );

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
          pointsByPlayer.get(
            entry.player_id,
          );

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
            playerPoints
              ?.points ??
            0,

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

              cards:
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

    total_points:
      fantasy.total_points,

    players,
  };
}