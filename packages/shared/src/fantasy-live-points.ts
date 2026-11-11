import {
  calculateFantasyPlayerPoints,
  type FantasyPlayerPointsInput,
  type FantasyPlayerPointsResult,
} from "./fantasy-points";


/**
 * El equipo beneficiado por un gol es el dato explicito si existe.
 * En goles historicos con goleador pero sin equipo, se infiere del jugador;
 * si es un autogol, se atribuye al rival. Sin datos fiables, devuelve null.
 * Se utiliza tanto para el marcador como para los puntos provisionales.
 */
export function getFantasyMatchScoringTeamId(
  event: {
    player_id: string | null;
    scoring_team_id: string | null;
    is_own_goal: boolean;
  },
  playerTeams: ReadonlyMap<string, string>,
  homeTeamId: string,
  awayTeamId: string,
): string | null {
  if (event.scoring_team_id !== null) return event.scoring_team_id;

  const actorTeam = event.player_id
    ? playerTeams.get(event.player_id) ?? null
    : null;
  if (!actorTeam) return null;

  if (event.is_own_goal) {
    if (actorTeam === homeTeamId) return awayTeamId;
    if (actorTeam === awayTeamId) return homeTeamId;
    return null;
  }

  return actorTeam;
}

/**
 * Puntuación basada únicamente en estadísticas registradas durante el partido.
 * No se anticipan valoración humana, MVP ni portería a cero: las dos últimas
 * dependen de conocer el final del encuentro y las condiciones de elegibilidad.
 */
export type ProvisionalFantasyPointsInput = Omit<
  FantasyPlayerPointsInput,
  "panel_rating" | "is_mvp" | "clean_sheet"
>;

export function calculateProvisionalFantasyPlayerPoints(
  input: ProvisionalFantasyPointsInput,
): FantasyPlayerPointsResult {
  const base = calculateFantasyPlayerPoints({
    ...input,
    panel_rating: null,
    is_mvp: false,
    clean_sheet: false,
  });

  // V3 calcula automáticamente la portería a cero a partir de los eventos.
  // Aunque se cumplan momentáneamente los 60', no es un bonus confirmado
  // hasta finalizar el partido; se excluye sin duplicar la tabla de puntos.
  const pendingCleanSheet = base.breakdown.clean_sheet;

  return {
    ...base,
    points: base.points - pendingCleanSheet,
    rateable: false,
    rounded_rating: null,
    breakdown: {
      ...base.breakdown,
      clean_sheet: 0,
      rating: 0,
      mvp: 0,
    },
  };
}

export type FantasyLiveClock = {
  live_phase: string;
  live_clock_seconds: number;
  live_clock_started_at: string | null;
};

/** Respeta el cronómetro de Match Admin y limita datos de reloj inválidos. */
export function getFantasyLiveMatchMinute(
  clock: FantasyLiveClock,
  now: number,
): number {
  const clockSeconds =
    Number.isSafeInteger(clock.live_clock_seconds) && clock.live_clock_seconds >= 0
      ? clock.live_clock_seconds
      : 0;

  let elapsedSeconds = 0;
  if (
    (clock.live_phase === "first_half" || clock.live_phase === "second_half") &&
    clock.live_clock_started_at
  ) {
    const startedAt = Date.parse(clock.live_clock_started_at);
    if (Number.isFinite(startedAt) && Number.isFinite(now)) {
      elapsedSeconds = Math.max(0, Math.floor((now - startedAt) / 1000));
    }
  }

  return Math.min(150, Math.floor((clockSeconds + elapsedSeconds) / 60));
}

export type FantasyLiveParticipant = {
  starter: boolean;
  on_field: boolean;
  entered_minute: number | null;
  minutes_played: number;
};

/**
 * Antes de una sustitución o del final, minutes_played puede estar todavía
 * sin persistir. Para el jugador en campo se usa el reloj y su minuto de
 * entrada; si faltan datos, no se inventan minutos.
 */
export function getFantasyLivePlayedMinutes(
  player: FantasyLiveParticipant,
  currentMinute: number,
): number {
  const storedMinutes =
    Number.isSafeInteger(player.minutes_played) && player.minutes_played >= 0
      ? player.minutes_played
      : 0;

  if (!player.on_field || !Number.isSafeInteger(currentMinute) || currentMinute < 0) {
    return storedMinutes;
  }

  const entryMinute = player.entered_minute ?? (player.starter ? 0 : null);
  if (entryMinute === null || !Number.isSafeInteger(entryMinute) || entryMinute < 0) {
    return storedMinutes;
  }

  return Math.max(storedMinutes, Math.max(0, currentMinute - entryMinute));
}
