"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import type { FantasyStandingEntry } from "@/data/fantasy-standings";

export type StandingFixture = {
  id: string;
  match_date: string;
  matchday_number: number | null;
  status: string;
};

type Props = {
  standings: readonly FantasyStandingEntry[];
  fixtures: readonly StandingFixture[];
  currentUserId: string;
  serverNow: number;
};

const LOCK_BEFORE_MATCH_MS = 2 * 60 * 60 * 1000;

/** Una jornada empieza a mostrarse de forma automática al bloquearse el XI. */
function getAutomaticView(fixtures: readonly StandingFixture[], now: number): string {
  const current = fixtures
    .filter((fixture) =>
      fixture.matchday_number !== null &&
      fixture.status !== "closed" &&
      Number.isFinite(Date.parse(fixture.match_date)) &&
      now >= Date.parse(fixture.match_date) - LOCK_BEFORE_MATCH_MS
    )
    .sort((a, b) => Date.parse(b.match_date) - Date.parse(a.match_date))[0];

  return current?.matchday_number == null ? "total" : String(current.matchday_number);
}

export default function FantasyStandingsSelector({
  standings,
  fixtures,
  currentUserId,
  serverNow,
}: Props) {
  const router = useRouter();
  const [now, setNow] = useState(serverNow);
  const [selectedView, setSelectedView] = useState(() => getAutomaticView(fixtures, serverNow));
  const automaticView = getAutomaticView(fixtures, now);
  const lastAutomaticView = useRef(automaticView);

  // La selección manual se respeta hasta el siguiente cambio automático:
  // bloqueo de XI o cierre del partido.
  useEffect(() => {
    if (lastAutomaticView.current !== automaticView) {
      lastAutomaticView.current = automaticView;
      setSelectedView(automaticView);
    }
  }, [automaticView]);

  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(clock);
  }, []);

  const hasCurrentFixture = automaticView !== "total";
  useEffect(() => {
    if (!hasCurrentFixture) return;
    // Actualizar el estado de Cerrado sin sobrecargar Supabase Auth:
    // una consulta por cliente cada dos minutos como máximo, y solo visible.
    const refresh = window.setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, 120_000);
    return () => window.clearInterval(refresh);
  }, [hasCurrentFixture, router]);

  const maxRound = Math.max(
    4,
    ...fixtures.map((fixture) => fixture.matchday_number ?? 0),
  );
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);
  const selectedRound = selectedView === "total" ? null : Number(selectedView);
  const roundFixtures = selectedRound === null
    ? []
    : fixtures.filter((fixture) => fixture.matchday_number === selectedRound);
  const hasRound = roundFixtures.length > 0;
  const roundClosed = hasRound && roundFixtures.every((fixture) => fixture.status === "closed");
  const roundMatchIds = new Set(roundFixtures.map((fixture) => fixture.id));
  const isTotal = selectedRound === null;
  const readyToDisplay = isTotal || roundClosed;

  const entries = isTotal ? [...standings] : standings
    .map((standing) => ({
      ...standing,
      total_points: standing.match_points
        .filter((entry) => roundMatchIds.has(entry.match_id))
        .reduce((sum, entry) => sum + entry.total_points, 0),
    }))
    .sort((a, b) =>
      b.total_points - a.total_points ||
      a.display_name.localeCompare(b.display_name, "es")
    );

  const leader = readyToDisplay ? entries[0] : null;
  const userIndex = entries.findIndex((entry) => entry.user_id === currentUserId);
  const myPointsBehind = userIndex < 0 || !leader
    ? 0 : leader.total_points - entries[userIndex].total_points;

  return (
    <section className="mt-7" aria-labelledby="fantasy-standings-title">
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Liga
          </p>
          <h2 id="fantasy-standings-title" className="mt-1 text-xl font-black text-zinc-950">
            Clasificación
          </h2>
        </div>
        <span className="text-[10px] font-semibold text-zinc-400">
          {standings.length} jugadores
        </span>
      </div>

      <div className="mt-3 rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-black/5">
        <label htmlFor="fantasy-standing-view" className="block text-[10px] font-black uppercase tracking-wide text-[#557368]">
          Consultar clasificación
        </label>
        <select
          id="fantasy-standing-view"
          value={selectedView}
          onChange={(event) => setSelectedView(event.target.value)}
          className="mt-2 min-h-12 w-full rounded-xl bg-[#e8f2ed] px-3 text-sm font-black text-[#0f3d2e] outline-none focus-visible:ring-2 focus-visible:ring-[#0f3d2e]"
        >
          <option value="total">Total · clasificación general</option>
          {rounds.map((round) => (
            <option key={round} value={String(round)}>
              Jornada {round}
            </option>
          ))}
        </select>
        <p aria-live="polite" className="mt-2 text-[11px] leading-4 text-zinc-500">
          {isTotal
            ? "Puntos acumulados de todas las jornadas cerradas."
            : !hasRound
              ? "Esta jornada no tiene partidos Fantasy registrados."
              : roundClosed
                ? "Jornada cerrada · puntos definitivos."
                : now >= Math.min(...roundFixtures.map((fixture) => Date.parse(fixture.match_date))) - LOCK_BEFORE_MATCH_MS
                  ? "Alineaciones bloqueadas · puntos pendientes de cierre."
                  : "Jornada programada · puntos todavía pendientes."}
        </p>
      </div>

      {!readyToDisplay ? (
        <div role="status" className="mt-3 rounded-[1.2rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-black text-[#0f3d2e]">
            {hasRound ? "Clasificación pendiente" : "Sin clasificación Fantasy"}
          </p>
          <p className="mt-2 text-xs leading-5 text-zinc-500">
            {hasRound
              ? "Los puntos de esta jornada aparecerán cuando el partido pase a Cerrado."
              : "No hay partidos puntuables registrados para esta jornada. El total no se modifica."}
          </p>
        </div>
      ) : (
        <>
          {leader && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <div className="rounded-[1.15rem] bg-[#0f3d2e] px-3 py-3 text-white">
                <p className="text-[8px] font-black uppercase tracking-wide text-white/55">
                  {isTotal ? "Líder" : "Líder de jornada"}
                </p>
                <p className="mt-1 truncate text-sm font-black">{leader.display_name}</p>
                <p className="mt-1 text-xl font-black">
                  {leader.total_points}<span className="ml-1 text-[9px] text-white/60">pts</span>
                </p>
              </div>
              <div className="rounded-[1.15rem] bg-[#e8f2ed] px-3 py-3">
                <p className="text-[8px] font-black uppercase tracking-wide text-[#557368]">
                  Tu distancia al líder
                </p>
                <p className="mt-1 text-xl font-black text-[#0f3d2e]">
                  {myPointsBehind}<span className="ml-1 text-[9px] text-[#557368]">pts</span>
                </p>
                <p className="mt-1 text-[9px] text-[#557368]">
                  {userIndex < 0 ? "Sin posición" : String(userIndex + 1) + " posición"}
                </p>
              </div>
            </div>
          )}

          <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">
            <div className={isTotal
              ? "grid grid-cols-[32px_minmax(0,1fr)_48px_48px] items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2"
              : "grid grid-cols-[32px_minmax(0,1fr)_60px] items-center gap-2 border-b border-zinc-100 bg-zinc-50 px-3 py-2"
            }>
              <span className="text-[8px] font-black uppercase text-zinc-400">Pos</span>
              <span className="text-[8px] font-black uppercase text-zinc-400">Jugador</span>
              {isTotal && <span className="text-center text-[8px] font-black uppercase text-zinc-400">Últ.</span>}
              <span className="text-right text-[8px] font-black uppercase text-zinc-400">
                {isTotal ? "Total" : "Puntos"}
              </span>
            </div>

            {entries.map((entry, index) => (
              <div
                key={entry.user_id}
                className={(isTotal
                  ? "grid grid-cols-[32px_minmax(0,1fr)_48px_48px]"
                  : "grid grid-cols-[32px_minmax(0,1fr)_60px]"
                ) + " items-center gap-2 border-b border-zinc-100 px-3 py-3 last:border-b-0 " +
                  (entry.user_id === currentUserId ? "bg-[#edf5f1]" : "bg-white")}
              >
                <span className={"flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-black " +
                  (index === 0 ? "bg-[#0f3d2e] text-white" : index < 3
                    ? "bg-[#e8f2ed] text-[#0f3d2e]" : "bg-zinc-100 text-zinc-600")}>
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-xs font-black text-zinc-950">{entry.display_name}</p>
                    {entry.user_id === currentUserId && (
                      <span className="shrink-0 rounded-full bg-[#0f3d2e] px-1.5 py-0.5 text-[7px] font-black text-white">
                        Tú
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[9px] font-bold">
                    {isTotal && (
                      <span className={entry.position_change === null ? "text-zinc-400" :
                        entry.position_change > 0 ? "text-emerald-700" :
                        entry.position_change < 0 ? "text-red-600" : "text-zinc-400"}>
                        {entry.position_change === null ? "Sin comparativa" :
                          entry.position_change > 0 ? "▲ " + entry.position_change + " puestos" :
                          entry.position_change < 0 ? "▼ " + Math.abs(entry.position_change) + " puestos" :
                          "— Sin cambios"}
                      </span>
                    )}
                    <span className="text-zinc-400">
                      {index === 0 ? "Líder" : "-" + (leader.total_points - entry.total_points) + " pts"}
                    </span>
                  </div>
                </div>
                {isTotal && (
                  <p className="text-center text-xs font-bold text-zinc-600">
                    {entry.last_match_points === null ? "—" : entry.last_match_points}
                  </p>
                )}
                <p className="text-right text-sm font-black text-zinc-950">{entry.total_points}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 px-1 text-[10px] leading-4 text-zinc-400">
            {isTotal
              ? "Últ. = última jornada cerrada. Las flechas comparan con la jornada anterior."
              : "Clasificación calculada exclusivamente con los puntos definitivos de esta jornada."}
          </p>
        </>
      )}
    </section>
  );
}
