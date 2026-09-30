import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";

import { getTeams } from "./teams";
import { getFantasyMatchPoints } from "./fantasy-match-points";

export type FantasyMatchday = {
  match_id: string;
  match_date: string;

  home_team_id: string;
  home_team_name: string;

  away_team_id: string;
  away_team_name: string;

  home_score: number | null;
  away_score: number | null;

  status: string;

  points_status:
    | "ready"
    | "not_ready";

  total_points: number | null;
};

export async function getUserFantasyMatchdays(input: {
  leagueId: string;
  userId: string;
}): Promise<FantasyMatchday[]> {
  const supabase =
    await createServerSupabaseClient();

  /*
   * Primero obtenemos las alineaciones que este
   * usuario ha guardado dentro de la liga.
   */
  const {
    data: lineups,
    error: lineupsError,
  } =
    await supabase
      .from("fantasy_lineups")
      .select(
        "id, match_id",
      )
      .eq(
        "league_id",
        input.leagueId,
      )
      .eq(
        "user_id",
        input.userId,
      );

  if (lineupsError) {
    throw lineupsError;
  }

  if (lineups.length === 0) {
    return [];
  }

  const matchIds =
    lineups.map(
      (lineup) =>
        lineup.match_id,
    );

  /*
   * Cargamos todos los partidos necesarios
   * de una sola vez.
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
      .in(
        "id",
        matchIds,
      );

  if (matchesError) {
    throw matchesError;
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

          const pointsReady =
            fantasyPoints.status ===
            "ready";

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
              pointsReady
                ? "ready"
                : "not_ready",

            total_points:
              pointsReady
                ? fantasyPoints.total_points
                : null,
          };
        },
      ),
    );

  /*
   * Mostramos primero las jornadas
   * más recientes.
   */
  matchdays.sort(
    (a, b) =>
      new Date(
        b.match_date,
      ).getTime() -
      new Date(
        a.match_date,
      ).getTime(),
  );

  return matchdays;
}