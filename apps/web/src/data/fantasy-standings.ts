import "server-only";

import {
  calculateFantasyLineupPoints,
  PLAYER_POSITIONS,
  type PlayerPosition,
} from "@regional-fantasy/shared";

import {
  getFantasyLeagueMembers,
} from "./fantasy-leagues";

import {
  getMatchResults,
} from "./match-results";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export type FantasyStandingEntry = {
  user_id:
    string;

  display_name:
    string;

  total_points:
    number;

  played_matches:
    number;
};

type FantasyLineupRow = {
  id:
    string;

  user_id:
    string;

  match_id:
    string;
};

type FantasyLineupPlayerRow = {
  lineup_id:
    string;

  player_id:
    string;
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

export async function getFantasyLeagueStandings(
  leagueId: string,
): Promise<
  FantasyStandingEntry[]
> {
  const members =
    await getFantasyLeagueMembers(
      leagueId,
    );

  const supabase =
    await createServerSupabaseClient();

  const {
    data: lineups,
    error: lineupsError,
  } =
    await supabase
      .from(
        "fantasy_lineups",
      )
      .select(
        "id, user_id, match_id",
      )
      .eq(
        "league_id",
        leagueId,
      );

  if (lineupsError) {
    throw lineupsError;
  }

  const standings =
    new Map<
      string,
      FantasyStandingEntry
    >();

  for (
    const member of
    members
  ) {
    standings.set(
      member.user_id,
      {
        user_id:
          member.user_id,

        display_name:
          member.profile
            ?.display_name ??
          "Usuario",

        total_points:
          0,

        played_matches:
          0,
      },
    );
  }

  if (
    lineups.length ===
    0
  ) {
    return sortStandings(
      [
        ...standings.values(),
      ],
    );
  }

  const lineupIds =
    lineups.map(
      (
        lineup,
      ) =>
        lineup.id,
    );

  const {
    data: lineupPlayers,
    error:
      lineupPlayersError,
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

  if (
    lineupPlayersError
  ) {
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
      ) ??
      [];

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
      ) ??
      [];

    /*
     * Una alineación Fantasy solo
     * puntúa si contiene exactamente
     * once jugadores.
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
     * Solo sumamos partidos cerrados.
     * Durante la votación las notas
     * todavía son provisionales.
     */
    if (
      matchResults.status !==
        "ready" ||
      matchResults.phase !==
        "final"
    ) {
      continue;
    }

    const resultByPlayer =
      new Map(
        matchResults.rows.map(
          (
            row,
          ) => [
            row.entry.player_id,
            row,
          ],
        ),
      );

    /*
     * Duración de referencia del
     * encuentro para la regla especial
     * del portero.
     */
    const matchMinutes =
      Math.max(
        0,
        ...matchResults.rows.map(
          (
            row,
          ) =>
            row.entry
              .minutes_played,
        ),
      );

    const fantasyInputs =
      selectedPlayerIds
        .map(
          (
            playerId,
          ) => {
            const result =
              resultByPlayer.get(
                playerId,
              );

            if (!result) {
              return null;
            }

            const position =
              toPlayerPosition(
                result.entry
                  .player
                  ?.position ??
                  null,
              );

            if (!position) {
              return null;
            }

            return {
              player_id:
                playerId,

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

    /*
     * Si falta algún jugador de los
     * once en los resultados, no
     * puntuamos todavía esa jornada.
     */
    if (
      fantasyInputs.length !==
      11
    ) {
      continue;
    }

    const fantasyResult =
      calculateFantasyLineupPoints(
        fantasyInputs,
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
    [
      ...standings.values(),
    ],
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