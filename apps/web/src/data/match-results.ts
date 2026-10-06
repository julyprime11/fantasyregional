import "server-only";

import {
  calculateFantasyPlayerPoints,
  calculatePlayerRating,
  DEFAULT_RATING_CONFIG,
  getResultsPhase,
  PLAYER_POSITIONS,
  selectMatchMvp,
  type FantasyPlayerPointsResult,
  type MatchMvpResult,
  type PanelVote,
  type PlayerPosition,
  type PlayerRatingResult,
  type RatingConfig,
  type ResultsPhase,
} from "@regional-fantasy/shared";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  getMatchById,
  type MatchRow,
} from "./matches";

import {
  getMatchPlayers,
  type MatchPlayerDetails,
} from "./match-players";

type ResultRow = {
  entry: MatchPlayerDetails;

  /*
   * Valoración humana:
   *
   * - media jugadores
   * - media directiva
   * - media entrenadores
   * - ponderación final
   */
  rating: PlayerRatingResult;

  /*
   * Puntos Fantasy definitivos
   * desglosados por concepto.
   */
  fantasy:
    FantasyPlayerPointsResult | null;
};

export type MatchResults =
  | {
      status:
        "not_found";
    }
  | {
      status:
        "not_ready";

      match:
        MatchRow;
    }
  | {
      status:
        "ready";

      phase:
        ResultsPhase;

      minimumVotes:
        number;

      match:
        MatchRow;

      /*
       * Duración utilizada como
       * referencia para el encuentro.
       */
      matchMinutes:
        number;

      rows:
        ResultRow[];

      mvp:
        MatchMvpResult;
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

export async function getMatchResults(
  matchId: string,
  config: Partial<RatingConfig> =
    DEFAULT_RATING_CONFIG,
): Promise<MatchResults> {
  const match =
    await getMatchById(
      matchId,
    );

  if (!match) {
    return {
      status:
        "not_found",
    };
  }

  const phase =
    getResultsPhase(
      match.status,
    );

  if (
    phase ===
    null
  ) {
    return {
      status:
        "not_ready",

      match,
    };
  }

  const squad =
    await getMatchPlayers(
      matchId,
    );

  const client =
    await createServerSupabaseClient();

  const votes =
    new Map<
      string,
      PanelVote[]
    >();

  /*
   * Paginamos para que el cálculo
   * siempre utilice todos los votos.
   */
  const pageSize =
    500;

  let offset =
    0;

  while (true) {
    const {
      data,
      error,
    } =
      await client
        .from(
          "ratings",
        )
        .select(
          "player_id, score, voter_role",
        )
        .eq(
          "match_id",
          matchId,
        )
        .order(
          "id",
        )
        .range(
          offset,
          offset +
            pageSize -
            1,
        );

    if (error) {
      throw error;
    }

    if (
      data.length ===
      0
    ) {
      break;
    }

    for (
      const vote of
      data
    ) {
      const existing =
        votes.get(
          vote.player_id,
        ) ??
        [];

      existing.push({
        score:
          vote.score,

        voter_role:
          vote.voter_role,
      });

      votes.set(
        vote.player_id,
        existing,
      );
    }

    offset +=
      data.length;

    if (
      data.length <
      pageSize
    ) {
      break;
    }
  }

  /*
   * Duración de referencia del partido.
   *
   * Utilizamos el mayor número de minutos
   * registrado entre los participantes.
   *
   * Esto es especialmente importante para
   * comprobar si el portero disputó el
   * encuentro completo.
   */
  const matchMinutes =
    Math.max(
      0,

      ...squad.map(
        (
          entry,
        ) =>
          entry.minutes_played,
      ),
    );

  /*
   * Primer paso:
   *
   * Calculamos valoración y puntos Fantasy
   * base SIN bonus MVP.
   *
   * El MVP se decide después, utilizando
   * únicamente las valoraciones finales.
   */
  const rows: ResultRow[] =
    squad.map(
      (
        entry,
      ) => {
        const position =
          toPlayerPosition(
            entry.player
              ?.position,
          );

        const rating =
          calculatePlayerRating(
            {
              player_id:
                entry.player_id,

              position,

              minutes_played:
                entry.minutes_played,

              goals:
                entry.goals,

              assists:
                entry.assists,

              yellow_cards:
                entry.yellow_cards,

              red_cards:
                entry.red_cards,

              clean_sheet:
                entry.clean_sheet,

              votes:
                votes.get(
                  entry.player_id,
                ) ??
                [],
            },
            config,
          );

        /*
         * Si por algún motivo la posición
         * no es válida, no inventamos
         * puntuación Fantasy.
         */
        const fantasy =
          position
            ? calculateFantasyPlayerPoints({
                player_id:
                  entry.player_id,

                position,

                minutes_played:
                  entry.minutes_played,

                goals:
                  entry.goals,

                assists:
                  entry.assists,

                yellow_cards:
                  entry.yellow_cards,

                red_cards:
                  entry.red_cards,

                clean_sheet:
                  entry.clean_sheet,

                starter:
                  entry.starter,

                match_minutes:
                  matchMinutes,

                /*
                 * final_rating contiene ahora
                 * la valoración humana ponderada.
                 *
                 * Las estadísticas ya no forman
                 * parte de esta nota.
                 */
                panel_rating:
                  rating.final_rating,

                /*
                 * El MVP todavía no se conoce.
                 *
                 * El bonus se aplica en un
                 * segundo paso.
                 */
                is_mvp:
                  false,
              })
            : null;

        return {
          entry,
          rating,
          fantasy,
        };
      },
    );

  /*
   * Segundo paso:
   *
   * Seleccionamos el MVP exclusivamente
   * a partir de las valoraciones humanas.
   */
  const mvp =
    selectMatchMvp(
      rows.map(
        (
          row,
        ) =>
          row.rating,
      ),
    );

  /*
   * Guardamos los IDs para poder aplicar
   * el bonus rápidamente.
   *
   * Si el MVP es compartido, habrá más de
   * un jugador dentro del Set.
   */
  const mvpPlayerIds =
    new Set(
      mvp.players.map(
        (
          player,
        ) =>
          player.player_id,
      ),
    );

  /*
   * Tercer paso:
   *
   * Aplicamos +3 puntos Fantasy al MVP.
   *
   * Importante:
   * el bonus MVP NO interviene en la
   * selección del propio MVP.
   */
  const rowsWithMvp: ResultRow[] =
    rows.map(
      (
        row,
      ) => {
        if (
          !row.fantasy ||
          !mvpPlayerIds.has(
            row.entry.player_id,
          )
        ) {
          return row;
        }

        return {
          ...row,

          fantasy: {
            ...row.fantasy,

            points:
              row.fantasy.points +
              3,

            breakdown: {
              ...row.fantasy.breakdown,

              mvp:
                3,
            },
          },
        };
      },
    );

  return {
    status:
      "ready",

    phase,

    minimumVotes:
      config.minimumVotes ??
      DEFAULT_RATING_CONFIG.minimumVotes,

    match,

    matchMinutes,

    rows:
      rowsWithMvp,

    mvp,
  };
}