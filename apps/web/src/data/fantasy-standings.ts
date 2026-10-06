import "server-only";

import {
  getFantasyLeagueMembers,
} from "./fantasy-leagues";

import {
  getUserFantasyMatchdays,
} from "./fantasy-matchdays";

export type FantasyStandingEntry = {
  user_id: string;

  display_name: string;

  total_points: number;

  played_matches: number;
};

export async function getFantasyLeagueStandings(
  leagueId: string,
): Promise<
  FantasyStandingEntry[]
> {
  const members =
    await getFantasyLeagueMembers(
      leagueId,
    );

  const standings =
    await Promise.all(
      members.map(
        async (
          member,
        ): Promise<FantasyStandingEntry> => {
          const matchdays =
            await getUserFantasyMatchdays({
              leagueId,

              userId:
                member.user_id,
            });

          /*
           * Solo cuentan jornadas con
           * resultados definitivos.
           *
           * Esto incluye:
           *
           * - XI presentado → puntos reales
           * - XI no presentado → 0 puntos
           *
           * Los puntos ya incluyen todo el
           * cálculo Fantasy realizado para
           * cada jornada:
           *
           * - minutos
           * - goles
           * - asistencias
           * - portería a cero
           * - tarjetas
           * - valoración
           * - bonus MVP
           */
          const readyMatchdays =
            matchdays.filter(
              (matchday) =>
                matchday.points_status ===
                "ready",
            );

          const totalPoints =
            readyMatchdays.reduce(
              (
                total,
                matchday,
              ) =>
                total +
                (
                  matchday.total_points ??
                  0
                ),
              0,
            );

          return {
            user_id:
              member.user_id,

            display_name:
              member.profile
                ?.display_name ??
              "Usuario",

            total_points:
              totalPoints,

            played_matches:
              readyMatchdays.length,
          };
        },
      ),
    );

  return sortStandings(
    standings,
  );
}

function sortStandings(
  entries:
    FantasyStandingEntry[],
): FantasyStandingEntry[] {
  return entries.sort(
    (
      a,
      b,
    ) => {
      if (
        b.total_points !==
        a.total_points
      ) {
        return (
          b.total_points -
          a.total_points
        );
      }

      if (
        b.played_matches !==
        a.played_matches
      ) {
        return (
          b.played_matches -
          a.played_matches
        );
      }

      return a.display_name.localeCompare(
        b.display_name,
        "es",
      );
    },
  );
}