import "server-only";

import {
  calculateFantasyLineupPoints,
} from "@regional-fantasy/shared";

import { getFantasyLeagueMembers } from "./fantasy-leagues";
import { getMatchResults } from "./match-results";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export type FantasyStandingEntry = {
  user_id: string;
  display_name: string;
  total_points: number;
  played_matches: number;
};

type FantasyLineupRow = {
  id: string;
  user_id: string;
  match_id: string;
};

type FantasyLineupPlayerRow = {
  lineup_id: string;
  player_id: string;
};

export async function getFantasyLeagueStandings(
  leagueId: string,
): Promise<FantasyStandingEntry[]> {
  const members =
    await getFantasyLeagueMembers(
      leagueId,
    );

  const supabase =
    await createServerSupabaseClient();

  const { data: lineups, error: lineupsError } =
    await supabase
      .from("fantasy_lineups")
      .select(
        "id, user_id, match_id",
      )
      .eq("league_id", leagueId);

  if (lineupsError) {
    throw lineupsError;
  }

  const standings =
    new Map<
      string,
      FantasyStandingEntry
    >();

  for (const member of members) {
    standings.set(
      member.user_id,
      {
        user_id:
          member.user_id,

        display_name:
          member.profile
            ?.display_name ??
          "Usuario",

        total_points: 0,
        played_matches: 0,
      },
    );
  }

  if (lineups.length === 0) {
    return sortStandings(
      [...standings.values()],
    );
  }

  const lineupIds =
    lineups.map(
      (lineup) => lineup.id,
    );

  const {
    data: lineupPlayers,
    error: lineupPlayersError,
  } =
    await supabase
      .from(
        "fantasy_lineup_players",
      )
      .select(
        "lineup_id, player_id",
      )
      .in(
        "lineup_id",
        lineupIds,
      );

  if (lineupPlayersError) {
    throw lineupPlayersError;
  }

  const playersByLineup =
    new Map<
      string,
      string[]
    >();

  for (
    const entry of
    lineupPlayers as FantasyLineupPlayerRow[]
  ) {
    const existing =
      playersByLineup.get(
        entry.lineup_id,
      ) ?? [];

    existing.push(
      entry.player_id,
    );

    playersByLineup.set(
      entry.lineup_id,
      existing,
    );
  }

  const matchResultsCache =
    new Map<
      string,
      Awaited<
        ReturnType<
          typeof getMatchResults
        >
      >
    >();

  for (
    const lineup of
    lineups as FantasyLineupRow[]
  ) {
    const selectedPlayerIds =
      playersByLineup.get(
        lineup.id,
      ) ?? [];

    /*
     * Solo consideramos una jornada
     * Fantasy válida si la alineación
     * contiene exactamente 11 jugadores.
     */
    if (
      selectedPlayerIds.length !==
      11
    ) {
      continue;
    }

    let matchResults =
      matchResultsCache.get(
        lineup.match_id,
      );

    if (!matchResults) {
      matchResults =
        await getMatchResults(
          lineup.match_id,
        );

      matchResultsCache.set(
        lineup.match_id,
        matchResults,
      );
    }

    /*
     * Solo los partidos cerrados tienen
     * resultados definitivos para la
     * clasificación Fantasy.
     *
     * Durante "voting" las notas son
     * provisionales y no se suman todavía.
     */
    if (
      matchResults.status !==
        "ready" ||
      matchResults.phase !==
        "final"
    ) {
      continue;
    }

    const ratingByPlayer =
      new Map(
        matchResults.rows.map(
          (row) => [
            row.entry.player_id,
            row.rating.final_rating,
          ],
        ),
      );

    const fantasyResult =
      calculateFantasyLineupPoints(
        selectedPlayerIds.map(
          (playerId) => ({
            player_id:
              playerId,

            final_rating:
              ratingByPlayer.get(
                playerId,
              ) ?? null,
          }),
        ),
      );

    const standing =
      standings.get(
        lineup.user_id,
      );

    if (!standing) {
      continue;
    }

    standing.total_points +=
      fantasyResult.total_points;

    standing.played_matches +=
      1;
  }

  return sortStandings(
    [...standings.values()],
  );
}

function sortStandings(
  entries: FantasyStandingEntry[],
): FantasyStandingEntry[] {
  return entries.sort(
    (a, b) => {
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