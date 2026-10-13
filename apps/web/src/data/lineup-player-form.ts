import "server-only";

import { getMatchResults } from "./match-results";
import type { MatchRow } from "./matches";

export type PlayerRecentForm = {
  average: number | null;
  points: (number | null)[];
};

export async function getLineupPlayerForm(
  matches: MatchRow[],
  teamId: string,
  playerIds: string[],
): Promise<Record<string, PlayerRecentForm>> {
  const lastFive = matches
    .filter(
      (match) =>
        match.status === "closed" &&
        (match.home_team_id === teamId ||
          match.away_team_id === teamId),
    )
    .sort(
      (a, b) =>
        new Date(a.match_date).getTime() -
        new Date(b.match_date).getTime(),
    )
    .slice(-5);

  const histories = new Map(
    playerIds.map((id) => [
      id,
      [] as (number | null)[],
    ]),
  );

  // La puntuación es global para jugador/partido,
  // independientemente de la liga Fantasy.
  const results = await Promise.all(
    lastFive.map((match) => getMatchResults(match.id)),
  );

  for (const result of results) {
    const pointsByPlayer = new Map<string, number>();

    if (result.status === "ready" && result.phase === "final") {
      for (const row of result.rows) {
        if (row.fantasy) {
          pointsByPlayer.set(row.entry.player_id, row.fantasy.points);
        }
      }
    }

    for (const [playerId, points] of histories) {
      points.push(pointsByPlayer.get(playerId) ?? null);
    }
  }

  return Object.fromEntries(
    [...histories].map(([playerId, points]) => {
      const rated = points.filter(
        (value): value is number => value !== null,
      );

      return [
        playerId,
        {
          points,
          average:
            rated.length > 0
              ? rated.reduce((sum, value) => sum + value, 0) /
                rated.length
              : null,
        },
      ];
    }),
  );
}
