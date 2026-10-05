import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  requireUser,
} from "@/lib/auth";

import {
  getFantasyLeagueById,
  getFantasyLeagueMembers,
} from "@/data/fantasy-leagues";

import {
  getUserFantasyMatchdays,
} from "@/data/fantasy-matchdays";

import {
  getFantasyLeagueStandings,
} from "@/data/fantasy-standings";

export default async function FantasyPointsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const user =
    await requireUser();

  const {
    id: leagueId,
  } =
    await params;

  const [
    league,
    members,
  ] =
    await Promise.all([
      getFantasyLeagueById(
        leagueId,
      ),

      getFantasyLeagueMembers(
        leagueId,
      ),
    ]);

  if (!league) {
    notFound();
  }

  const currentMember =
    members.find(
      (member) =>
        member.user_id ===
        user.id,
    );

  if (!currentMember) {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No tienes acceso a esta liga
          </p>

          <p className="mt-2 text-sm leading-6 text-red-600">
            Debes pertenecer a la liga para consultar tus puntos.
          </p>

          <Link
            href="/fantasy/leagues"
            className="mt-5 inline-flex text-sm font-black text-red-700 underline"
          >
            ← Volver a mis ligas
          </Link>
        </section>
      </main>
    );
  }

  const [
    matchdays,
    standings,
  ] =
    await Promise.all([
      getUserFantasyMatchdays({
        leagueId,
        userId:
          user.id,
      }),

      getFantasyLeagueStandings(
        leagueId,
      ),
    ]);

  const readyMatchdays =
    matchdays.filter(
      (matchday) =>
        matchday.points_status ===
        "ready",
    );

  const totalPoints =
    readyMatchdays.reduce(
      (
        total,
        matchday,
      ) =>
        total +
        (
          matchday.total_points ??
          0
        ),
      0,
    );

  const averagePoints =
    readyMatchdays.length >
    0
      ? totalPoints /
        readyMatchdays.length
      : 0;

  const currentStandingIndex =
    standings.findIndex(
      (entry) =>
        entry.user_id ===
        user.id,
    );

  const rankingPosition =
    currentStandingIndex >=
    0
      ? currentStandingIndex +
        1
      : null;

  const currentStanding =
    standings.find(
      (entry) =>
        entry.user_id ===
        user.id,
    ) ??
    null;

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/fantasy?league=${encodeURIComponent(
              leagueId,
            )}`}
            className="text-[11px] font-bold text-white/65"
          >
            ← Fantasy
          </Link>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            {league.name}
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Mis puntos
              </h1>

              <p className="mt-1 text-xs text-white/60">
                Rendimiento por jornada
              </p>
            </div>

            <div className="rounded-[1rem] bg-white/10 px-4 py-2 text-center">
              <p className="text-[7px] font-black uppercase tracking-wide text-white/45">
                Total
              </p>

              <p className="text-2xl font-black">
                {totalPoints}
              </p>

              <p className="text-[7px] font-black uppercase text-white/45">
                pts
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* RESUMEN */}
        <section className="mt-4 grid grid-cols-3 gap-2">
          <SummaryCard
            value={
              readyMatchdays.length
            }
            label="Jornadas"
          />

          <SummaryCard
            value={
              averagePoints.toFixed(
                1,
              )
            }
            label="Media"
          />

          <SummaryCard
            value={
              rankingPosition
                ? `${rankingPosition}º`
                : "—"
            }
            label="Posición"
            highlight
          />
        </section>

        {/* CLASIFICACIÓN PERSONAL */}
        {currentStanding && (
          <section className="mt-3 rounded-[1.2rem] bg-[#e8f2ed] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
                  Liga
                </p>

                <p className="mt-0.5 text-sm font-black text-[#0b2f23]">
                  {league.name}
                </p>

                <p className="mt-1 text-[10px] text-[#557368]">
                  {
                    currentStanding.played_matches
                  }{" "}
                  jornadas puntuadas
                </p>
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-[#0f3d2e]">
                  {
                    currentStanding.total_points
                  }
                </p>

                <p className="text-[7px] font-black uppercase tracking-wide text-[#557368]">
                  puntos
                </p>
              </div>
            </div>
          </section>
        )}

        {/* HISTÓRICO */}
        <section className="mt-7">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Temporada
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                Jornadas
              </h2>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">
              {
                matchdays.length
              }{" "}
              partidos
            </span>
          </div>

          {matchdays.length ===
          0 ? (
            <div className="mt-3 rounded-[1.3rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f2ed] text-xl">
                ⚽
              </div>

              <p className="mt-3 font-black text-zinc-950">
                Todavía no tienes jornadas
              </p>

              <p className="mt-1 text-xs leading-5 text-zinc-500">
                Cuando guardes tu primer XI aparecerá aquí el seguimiento de
                tus puntos.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {matchdays.map(
                (
                  matchday,
                  index,
                ) => {
                  const ready =
                    matchday.points_status ===
                    "ready";

                  const dateLabel =
                    new Intl.DateTimeFormat(
                      "es-ES",
                      {
                        weekday:
                          "short",

                        day:
                          "numeric",

                        month:
                          "short",

                        timeZone:
                          "Europe/Madrid",
                      },
                    ).format(
                      new Date(
                        matchday.match_date,
                      ),
                    );

                  const hasResult =
                    matchday.home_score !==
                      null &&
                    matchday.away_score !==
                      null;

                  /*
                   * matchdays llega ordenado
                   * del más reciente al más antiguo.
                   *
                   * Numeramos desde atrás para que
                   * visualmente la jornada más antigua
                   * sea J1.
                   */
                  const matchdayNumber =
                    matchdays.length -
                    index;

                  return (
                    <Link
                      key={
                        matchday.match_id
                      }
                      href={`/fantasy/leagues/${leagueId}/matches/${matchday.match_id}`}
                      className="block overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                    >
                      <div className="flex items-center justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-[#e8f2ed] px-2 py-1 text-[8px] font-black uppercase text-[#0f3d2e]">
                              J
                              {
                                matchdayNumber
                              }
                            </span>

                            <span className="text-[9px] font-bold capitalize text-zinc-400">
                              {
                                dateLabel
                              }
                            </span>
                          </div>

                          <div className="mt-2 flex items-center gap-2 text-xs font-black text-zinc-950">
                            <span className="truncate">
                              {
                                matchday.home_team_name
                              }
                            </span>

                            <span className="shrink-0 text-zinc-400">
                              {hasResult
                                ? `${matchday.home_score} - ${matchday.away_score}`
                                : "vs"}
                            </span>

                            <span className="truncate">
                              {
                                matchday.away_team_name
                              }
                            </span>
                          </div>

{ready &&
matchday.lineup_status ===
  "missing" ? (
  <p className="mt-1 text-[9px] font-semibold text-red-500">
    No presentaste XI · 0 puntos
  </p>
) : !ready ? (
  <p className="mt-1 text-[9px] font-semibold text-amber-600">
    Puntos pendientes
  </p>
) : (
  <p className="mt-1 text-[9px] font-semibold text-[#557368]">
    XI puntuado
  </p>
)}
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                          <div className="text-right">
                            {ready ? (
                              <>
                                <p
                                  className={`text-2xl font-black ${
                                    (
                                      matchday.total_points ??
                                      0
                                    ) <
                                    0
                                      ? "text-red-600"
                                      : "text-[#0f3d2e]"
                                  }`}
                                >
                                  {
                                    matchday.total_points
                                  }
                                </p>

                                <p className="text-[7px] font-black uppercase tracking-wide text-zinc-400">
                                  pts
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-lg font-black text-zinc-300">
                                  —
                                </p>

                                <p className="text-[7px] font-black uppercase text-zinc-400">
                                  pendiente
                                </p>
                              </>
                            )}
                          </div>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-xs font-black text-zinc-500">
                            →
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  value,
  label,
  highlight = false,
}: {
  value:
    | number
    | string;

  label: string;

  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.2rem] px-2 py-4 text-center shadow-sm ring-1 ${
        highlight
          ? "bg-[#e8f2ed] ring-[#d7e8df]"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-xl font-black ${
          highlight
            ? "text-[#0f3d2e]"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-1 text-[7px] font-black uppercase tracking-wide ${
          highlight
            ? "text-[#557368]"
            : "text-zinc-400"
        }`}
      >
        {label}
      </p>
    </div>
  );
}