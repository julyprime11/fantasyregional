export type FantasyStandingFixture = {
  match_date: string;
  matchday_number: number | null;
  status: string;
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Antes del bloqueo del XI y despues del cierre se muestra el total.
 * Desde dos horas antes del partido y hasta su cierre se selecciona
 * automaticamente la jornada oficial, sin deducirla del calendario.
 */
export function getAutomaticFantasyStandingView(
  fixtures: readonly FantasyStandingFixture[],
  now: number,
): string {
  const active = fixtures
    .filter((fixture) =>
      fixture.matchday_number !== null &&
      Number.isSafeInteger(fixture.matchday_number) &&
      fixture.matchday_number > 0 &&
      fixture.status !== "closed" &&
      Number.isFinite(Date.parse(fixture.match_date)) &&
      now >= Date.parse(fixture.match_date) - TWO_HOURS_MS
    )
    .sort((a, b) =>
      Date.parse(b.match_date) - Date.parse(a.match_date)
    )[0];

  return active?.matchday_number == null
    ? "total"
    : String(active.matchday_number);
}
