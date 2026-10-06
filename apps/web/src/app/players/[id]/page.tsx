import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  getPlayerProfile,
} from "@/data/player-profile";

function formatPosition(
  position: string,
): string {
  const labels: Record<
    string,
    string
  > = {
    GK:
      "Portero",

    RB:
      "Lateral derecho",

    CB:
      "Defensa central",

    LB:
      "Lateral izquierdo",

    RWB:
      "Carrilero derecho",

    LWB:
      "Carrilero izquierdo",

    DM:
      "Mediocentro defensivo",

    CM:
      "Mediocentro",

    AM:
      "Mediapunta",

    RW:
      "Extremo derecho",

    LW:
      "Extremo izquierdo",

    ST:
      "Delantero",
  };

  return (
    labels[position] ??
    position
  );
}

function formatMatchDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
    {
      day:
        "numeric",

      month:
        "short",

      year:
        "numeric",
    },
  ).format(
    new Date(
      value,
    ),
  );
}

function formatRating(
  value:
    number | null,
): string {
  if (
    value ===
    null
  ) {
    return "—";
  }

  return value.toFixed(
    1,
  );
}

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } =
    await params;

  let profile;

  try {
    profile =
      await getPlayerProfile(
        id,
      );
  } catch (
    error
  ) {
    console.error(
      "PlayerProfilePage:",
      error,
    );

    return (
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No se pudo cargar el perfil del jugador.
          </p>

          <Link
            href="/fantasy"
            className="mt-4 inline-flex text-sm font-black text-red-700 underline"
          >
            ← Volver al Fantasy
          </Link>
        </section>
      </main>
    );
  }

  if (!profile) {
    notFound();
  }

  const {
    player,
    team,
    stats,
    matches,
  } =
    profile;

  const fullName =
    `${player.first_name} ${
      player.last_name ??
      ""
    }`.trim();

  const recentMatches =
    matches.slice(
      0,
      6,
    );

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] pb-10">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-4 pb-7 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-24 -left-20 h-52 w-52 rounded-full border-[32px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/fantasy"
            className="text-[11px] font-bold text-white/65"
          >
            ← Fantasy
          </Link>

          <div className="mt-7 flex items-center gap-4">
            <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[1.6rem] bg-white/10 ring-1 ring-white/15">
              {player.image_url ? (
                <img
                  src={
                    player.image_url
                  }
                  alt={
                    fullName
                  }
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-white/70">
                  {
                    player.shirt_number ??
                    "?"
                  }
                </span>
              )}

              {player.shirt_number !==
                null && (
                <span className="absolute bottom-1.5 right-1.5 flex h-7 min-w-7 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[10px] font-black text-white shadow">
                  #
                  {
                    player.shirt_number
                  }
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                Perfil del jugador
              </p>

              <h1 className="mt-1 text-2xl font-black leading-tight tracking-tight">
                {
                  fullName
                }
              </h1>

              <p className="mt-1 text-xs font-bold text-white/70">
                {formatPosition(
                  player.position,
                )}
              </p>

              {team && (
                <p className="mt-1 truncate text-[11px] text-white/50">
                  {
                    team.name
                  }

                  {team.category
                    ? ` · ${team.category}`
                    : ""}
                </p>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="px-4">
        {/* TEMPORADA */}
        <section className="mt-5">
          <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Temporada
          </p>

          <div className="grid grid-cols-3 gap-2">
            <StatCard
              value={
                stats.appearances
              }
              label="Partidos"
            />

            <StatCard
              value={
                stats.minutes
              }
              label="Minutos"
            />

            <StatCard
              value={
                stats.mvp_count
              }
              label="MVP"
              highlight={
                stats.mvp_count >
                0
              }
            />
          </div>

          <div className="mt-2 grid grid-cols-3 gap-2">
            <StatCard
              value={
                stats.goals
              }
              label="Goles"
            />

            <StatCard
              value={
                stats.assists
              }
              label="Asistencias"
            />

            <StatCard
              value={
                stats.average_rating ===
                null
                  ? "—"
                  : stats.average_rating.toFixed(
                      1,
                    )
              }
              label="Nota media"
            />
          </div>
        </section>

        {/* FANTASY */}
        <section className="mt-7">
          <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Fantasy
          </p>

          <div className="overflow-hidden rounded-[1.4rem] bg-[#0f3d2e] text-white shadow-lg">
            <div className="grid grid-cols-2 divide-x divide-white/10">
              <div className="p-5 text-center">
                <p className="text-3xl font-black">
                  {
                    stats.fantasy_points
                  }
                </p>

                <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-white/45">
                  Puntos totales
                </p>
              </div>

              <div className="p-5 text-center">
                <p className="text-3xl font-black">
                  {stats.fantasy_average ===
                  null
                    ? "—"
                    : stats.fantasy_average.toFixed(
                        1,
                      )}
                </p>

                <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-white/45">
                  Media / partido
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* DATOS ADICIONALES */}
        <section className="mt-7">
          <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Rendimiento
          </p>

          <div className="grid grid-cols-2 gap-2">
            <SmallStat
              value={
                stats.starts
              }
              label="Titularidades"
            />

            <SmallStat
              value={
                stats.clean_sheets
              }
              label="Porterías a cero"
            />

            <SmallStat
              value={
                stats.yellow_cards
              }
              label="Amarillas"
            />

            <SmallStat
              value={
                stats.red_cards
              }
              label="Rojas"
            />
          </div>
        </section>

        {/* ÚLTIMOS PARTIDOS */}
        <section className="mt-7">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Rendimiento
              </p>

              <h2 className="mt-1 text-xl font-black text-zinc-950">
                Últimos partidos
              </h2>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">
              {
                matches.length
              }
            </span>
          </div>

          {recentMatches.length ===
          0 ? (
            <div className="mt-3 rounded-[1.3rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-black text-zinc-950">
                Sin partidos
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Todavía no hay estadísticas disponibles para este jugador.
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {recentMatches.map(
                (
                  match,
                ) => (
                  <article
                    key={
                      match.match_id
                    }
                    className="overflow-hidden rounded-[1.3rem] bg-white shadow-sm ring-1 ring-black/5"
                  >
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold capitalize text-zinc-400">
                            {formatMatchDate(
                              match.match_date,
                            )}
                          </p>

                          <p className="mt-1 text-sm font-black leading-5 text-zinc-950">
                            {
                              match.home_team_name
                            }

                            <span className="mx-1.5 text-zinc-300">
                              -
                            </span>

                            {
                              match.away_team_name
                            }
                          </p>
                        </div>

                        {match.home_score !==
                          null ||
                        match.away_score !==
                          null ? (
                          <div className="shrink-0 rounded-xl bg-zinc-950 px-3 py-2 text-sm font-black text-white">
                            {match.home_score ??
                              "—"}

                            <span className="mx-1 text-zinc-500">
                              -
                            </span>

                            {match.away_score ??
                              "—"}
                          </div>
                        ) : null}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        <MatchTag>
                          {
                            match.minutes_played
                          }
                          &apos;
                        </MatchTag>

                        {match.goals >
                          0 && (
                          <MatchTag>
                            ⚽{" "}
                            {
                              match.goals
                            }
                          </MatchTag>
                        )}

                        {match.assists >
                          0 && (
                          <MatchTag>
                            A{" "}
                            {
                              match.assists
                            }
                          </MatchTag>
                        )}

                        {match.is_mvp && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-black text-amber-700">
                            🏆 MVP
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 border-t border-zinc-100 bg-zinc-50/70">
                      <div className="p-3 text-center">
                        <p className="text-sm font-black text-zinc-950">
                          {formatRating(
                            match.final_rating,
                          )}
                        </p>

                        <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-zinc-400">
                          Nota
                        </p>
                      </div>

                      <div className="border-l border-zinc-100 p-3 text-center">
                        <p className="text-sm font-black text-[#0f3d2e]">
                          {match.fantasy_points ===
                          null
                            ? "—"
                            : `${match.fantasy_points} pts`}
                        </p>

                        <p className="mt-0.5 text-[8px] font-black uppercase tracking-wide text-zinc-400">
                          Fantasy
                        </p>
                      </div>
                    </div>
                  </article>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  value,
  label,
  highlight = false,
}: {
  value:
    string | number;

  label: string;

  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.2rem] p-3 text-center shadow-sm ring-1 ${
        highlight
          ? "bg-amber-50 ring-amber-100"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-xl font-black ${
          highlight
            ? "text-amber-700"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[8px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function SmallStat({
  value,
  label,
}: {
  value:
    string | number;

  label: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-[1.1rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-xs font-bold text-zinc-500">
        {label}
      </p>

      <p className="text-lg font-black text-zinc-950">
        {value}
      </p>
    </div>
  );
}

function MatchTag({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[9px] font-black text-zinc-600">
      {children}
    </span>
  );
}