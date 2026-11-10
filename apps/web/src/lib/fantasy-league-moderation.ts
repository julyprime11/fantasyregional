/**
 * Estados compartidos de las ligas Fantasy.
 * La fuente de verdad es fantasy_leagues.moderation_status.
 */
export const FANTASY_LEAGUE_STATUSES = [
  "active",
  "suspended",
  "removed",
] as const;

export type FantasyLeagueModerationStatus =
  (typeof FANTASY_LEAGUE_STATUSES)[number];

export function isFantasyLeagueActive(
  status: FantasyLeagueModerationStatus,
): boolean {
  return status === "active";
}
