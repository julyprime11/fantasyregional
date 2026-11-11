import type { LiveMatchPhase } from "@/data/matches";

/**
 * Mismo reloj para Match Admin y Fantasy:
 * tiempo acumulado en BD + segundos transcurridos desde el último arranque.
 * Nunca suma tiempo durante descanso, partido preparado o finalizado.
 */
export function calculateLiveClockSeconds(
  phase: LiveMatchPhase,
  storedSeconds: number,
  startedAt: string | null,
  nowMs: number = Date.now(),
): number {
  const baseSeconds = Math.max(0, Math.floor(storedSeconds));
  if ((phase !== "first_half" && phase !== "second_half") || !startedAt) {
    return baseSeconds;
  }

  const startedAtMs = Date.parse(startedAt);
  if (!Number.isFinite(startedAtMs)) return baseSeconds;

  return baseSeconds + Math.max(0, Math.floor((nowMs - startedAtMs) / 1000));
}

export function formatLiveClock(seconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(seconds));
  const minutes = Math.floor(totalSeconds / 60);
  const remainder = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
}
