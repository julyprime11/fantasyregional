import type { MatchRow } from "@/data/matches";

/**
 * El inicio de Match Admin cambia live_phase, pero no necesariamente status.
 * Por eso la detección del directo nunca depende solo de status.
 */
const ACTIVE_PHASES = ["first_half", "halftime", "second_half"] as const;

export function isFantasyMatchPlaying(phase: string): boolean {
  return ACTIVE_PHASES.some((active) => active === phase);
}

/** El seguimiento continúa tras el pitido final hasta abrir votaciones. */
export function isFantasyMatchFollowable(
  match: Pick<MatchRow, "live_phase" | "status">,
): boolean {
  return (
    isFantasyMatchPlaying(match.live_phase) ||
    (match.live_phase === "finished" && match.status === "finished")
  );
}

export function getFantasyLiveMatch(
  matches: readonly MatchRow[],
  teamId: string,
): MatchRow | null {
  return (
    matches
      .filter(
        (match) =>
          (match.home_team_id === teamId || match.away_team_id === teamId) &&
          isFantasyMatchFollowable(match),
      )
      .sort((a, b) => {
        const activeDifference =
          Number(isFantasyMatchPlaying(b.live_phase)) -
          Number(isFantasyMatchPlaying(a.live_phase));
        if (activeDifference !== 0) {
          return activeDifference;
        }
        return Date.parse(b.match_date) - Date.parse(a.match_date);
      })[0] ?? null
  );
}

export function getFantasyLivePhaseLabel(phase: string): string {
  switch (phase) {
    case "first_half":
      return "Primera parte";
    case "halftime":
      return "Descanso";
    case "second_half":
      return "Segunda parte";
    case "finished":
      return "Finalizado";
    default:
      return "Partido";
  }
}
