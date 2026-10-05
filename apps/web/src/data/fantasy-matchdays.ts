import "server-only";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  getFantasyLeagueById,
} from "./fantasy-leagues";

import {
  getTeams,
} from "./teams";

import {
  getFantasyMatchPoints,
} from "./fantasy-match-points";

import {
  getMatchResults,
} from "./match-results";

export type FantasyMatchday = {
  match_id: string;
  match_date: string;

  home_team_id: string;
  home_team_name: string;

  away_team_id: string;
  away_team_name: string;

  home_score:
    number | null;

  away_score:
    number | null;

  status: string;

  /*
   * ready:
   * la jornada ya tiene puntuación definitiva.
   *
   * not_ready:
   * el partido todavía no tiene resultados
   * Fantasy definitivos.
   */
  points_status:
    | "ready"
    | "not_ready";

  /*
   * submitted:
   * el usuario tenía XI para esa jornada.
   *
   * missing:
   * no presentó XI.
   *
   * Si el partido ya está cerrado,
   * missing = 0 puntos.
   */
  lineup_status:
    | "submitted"
    | "missing";

  total_points:
    number | null;
};

export async function getUserFantasyMatchdays(
  input: {
    leagueId: string;
    userId: string;
  },
): Promise<FantasyMatchday[]> {
  const league =
    await getFantasyLeagueById(
      input.leagueId,
    );

  if (!league) {
    return [];
  }

  const supabase =
    await createServerSupabaseClient();

  /*
   * Una jornada Fantasy corresponde a
   * cualquier partido en el que participe
   * el equipo asociado a la liga.
   *
   * IMPORTANTE:
   * ya no partimos de fantasy_lineups.
   *
   * De esta forma también aparecen las
   * jornadas en las que el usuario NO
   * presentó un XI.
   */
  const {
    data: matches,
    error: matchesError,
  } =
    await supabase
      .from("matches")
      .select(
        `
          id,
          match_date,
          home_team_id,
          away_team_id,
          home_score,
          away_score,
          status
        `,
      )
      .or(
        `home_team_id.eq.${league.team_id},away_team_id.eq.${league.team_id}`,
      );

  if (matchesError) {
    throw matchesError;
  }

  if (
    matches.length ===
    0
  ) {
    return [];
  }

  const teams =
    await getTeams();

  const teamNames =
    new Map(
      teams.map(
        (team) => [
          team.id,
          team.name,
        ],
      ),
    );

  const matchdays =
    await Promise.all(
      matches.map(
        async (
          match,
        ): Promise<FantasyMatchday> => {
          const fantasyPoints =
            await getFantasyMatchPoints({
              leagueId:
                input.leagueId,

              userId:
                input.userId,

              matchId:
                match.id,
            });

          /*
           * CASO 1:
           * existe XI y los puntos ya son
           * definitivos.
           */
          if (
            fantasyPoints.status ===
            "ready"
          ) {
            return {
              match_id:
                match.id,

              match_date:
                match.match_date,

              home_team_id:
                match.home_team_id,

              home_team_name:
                teamNames.get(
                  match.home_team_id,
                ) ??
                "Equipo local",

              away_team_id:
                match.away_team_id,

              away_team_name:
                teamNames.get(
                  match.away_team_id,
                ) ??
                "Equipo visitante",

              home_score:
                match.home_score,

              away_score:
                match.away_score,

              status:
                match.status,

              points_status:
                "ready",

              lineup_status:
                "submitted",

              total_points:
                fantasyPoints.total_points,
            };
          }

          /*
           * CASO 2:
           * había XI, pero el partido todavía
           * no tiene resultados definitivos.
           */
          if (
            fantasyPoints.status ===
            "not_ready"
          ) {
            return {
              match_id:
                match.id,

              match_date:
                match.match_date,

              home_team_id:
                match.home_team_id,

              home_team_name:
                teamNames.get(
                  match.home_team_id,
                ) ??
                "Equipo local",

              away_team_id:
                match.away_team_id,

              away_team_name:
                teamNames.get(
                  match.away_team_id,
                ) ??
                "Equipo visitante",

              home_score:
                match.home_score,

              away_score:
                match.away_score,

              status:
                match.status,

              points_status:
                "not_ready",

              lineup_status:
                "submitted",

              total_points:
                null,
            };
          }

          /*
           * CASO 3:
           * NO existe XI.
           *
           * Comprobamos si el partido ya tiene
           * resultados finales.
           *
           * Si ya es final:
           * jornada válida = 0 puntos.
           *
           * Si todavía no es final:
           * sigue pendiente.
           */
          const results =
            await getMatchResults(
              match.id,
            );

          const final =
            results.status ===
              "ready" &&
            results.phase ===
              "final";

          return {
            match_id:
              match.id,

            match_date:
              match.match_date,

            home_team_id:
              match.home_team_id,

            home_team_name:
              teamNames.get(
                match.home_team_id,
              ) ??
              "Equipo local",

            away_team_id:
              match.away_team_id,

            away_team_name:
              teamNames.get(
                match.away_team_id,
              ) ??
              "Equipo visitante",

            home_score:
              match.home_score,

            away_score:
              match.away_score,

            status:
              match.status,

            points_status:
              final
                ? "ready"
                : "not_ready",

            lineup_status:
              "missing",

            total_points:
              final
                ? 0
                : null,
          };
        },
      ),
    );

  /*
   * Jornada más reciente primero.
   */
  matchdays.sort(
    (
      a,
      b,
    ) =>
      new Date(
        b.match_date,
      ).getTime() -
      new Date(
        a.match_date,
      ).getTime(),
  );

  return matchdays;
}