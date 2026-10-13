import "server-only";

import {
  getFantasyLeagueMembers,
} from "./fantasy-leagues";

import {
  getUserFantasyMatchdays,
  type FantasyMatchday,
} from "./fantasy-matchdays";

export type FantasyStandingEntry = {
  user_id: string;
  display_name: string;
  total_points: number;
  played_matches: number;
  last_match_points: number | null;
  points_behind_leader: number;
  position_change: number | null;
};

type BaseEntry = Pick<
  FantasyStandingEntry,
  "user_id" | "display_name" | "total_points" | "played_matches"
>;

function sortStandings<T extends BaseEntry>(
  entries: T[],
): T[] {
  return entries.sort((a, b) => {
    if (b.total_points !== a.total_points) {
      return b.total_points - a.total_points;
    }

    if (b.played_matches !== a.played_matches) {
      return b.played_matches - a.played_matches;
    }

    return a.display_name.localeCompare(
      b.display_name,
      "es",
    );
  });
}

export async function getFantasyLeagueStandings(
  leagueId: string,
): Promise<FantasyStandingEntry[]> {
  const members =
    await getFantasyLeagueMembers(leagueId);

  // Consultamos cada usuario una única vez.
  const histories = await Promise.all(
    members.map(async (member) => {
      const matchdays =
        await getUserFantasyMatchdays({
          leagueId,
          userId: member.user_id,
        });

      return {
        user_id: member.user_id,
        display_name:
          member.profile?.display_name ?? "Usuario",
        ready: matchdays.filter(
          (matchday) =>
            matchday.points_status === "ready",
        ),
      };
    }),
  );

  // La última jornada es la misma para todos los participantes.
  // No tomamos la última jornada individual de cada usuario.
  const latestReadyMatch =
    histories.flatMap((history) => history.ready)
      .sort(
        (a, b) =>
          new Date(b.match_date).getTime() -
          new Date(a.match_date).getTime(),
      )[0] ?? null;

  const lastMatchId =
    latestReadyMatch?.match_id ?? null;

  function pointsFor(
    ready: FantasyMatchday[],
  ): number {
    return ready.reduce(
      (sum, matchday) =>
        sum + (matchday.total_points ?? 0),
      0,
    );
  }

  const standings =
    sortStandings(
      histories.map((history): FantasyStandingEntry => {
        const last =
          lastMatchId
            ? history.ready.find(
                (matchday) =>
                  matchday.match_id === lastMatchId,
              )
            : null;

        return {
          user_id: history.user_id,
          display_name: history.display_name,
          total_points: pointsFor(history.ready),
          played_matches: history.ready.length,
          last_match_points:
            last?.total_points ?? null,
          points_behind_leader: 0,
          position_change: null,
        };
      }),
    );

  // Solo mostramos movimiento cuando hay una jornada anterior.
  // Si es la primera, no existe una clasificación previa real.
  const hasEarlierMatch =
    histories.some((history) =>
      history.ready.some(
        (matchday) =>
          matchday.match_id !== lastMatchId,
      ),
    );

  if (hasEarlierMatch && lastMatchId) {
    const previousStandings =
      sortStandings(
        histories.map((history) => {
          const earlier =
            history.ready.filter(
              (matchday) =>
                matchday.match_id !== lastMatchId,
            );

          return {
            user_id: history.user_id,
            display_name: history.display_name,
            total_points: pointsFor(earlier),
            played_matches: earlier.length,
          };
        }),
      );

    const previousPositions =
      new Map(
        previousStandings.map(
          (standing, index) => [
            standing.user_id,
            index + 1,
          ],
        ),
      );

    standings.forEach((standing, index) => {
      standing.position_change =
        (previousPositions.get(standing.user_id) ??
          index + 1) -
        (index + 1);
    });
  }

  const leaderPoints =
    standings[0]?.total_points ?? 0;

  for (const standing of standings) {
    standing.points_behind_leader =
      leaderPoints - standing.total_points;
  }

  return standings;
}
