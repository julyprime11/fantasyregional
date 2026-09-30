import Link from "next/link";
import { notFound } from "next/navigation";

import {
  parseMatchId,
} from "@regional-fantasy/shared";

import {
  getMatchResults,
} from "@/data/match-results";

const display = (
  value: number | null,
): string =>
  value === null
    ? "—"
    : value.toFixed(2);

export default async function MatchAdminResultsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  let matchId: string;

  try {
    matchId =
      parseMatchId(id);
  } catch {
    notFound();
  }

  let result;

  try {
    result =
      await getMatchResults(
        matchId,
      );
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <Link
              href={`/match-admin/${matchId}`}
              className="text-sm font-bold text-white/70"
            >
              ← Volver al partido
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Match Admin
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Resultados
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-red-50 p-5">
            <p className="font-black text-red-700">
              No se pudieron calcular los resultados.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (
    result.status ===
    "not_found"
  ) {
    notFound();
  }

  if (
    result.status ===
    "not_ready"
  ) {
    const message =
      result.match.status ===
      "finished"
        ? "La votación de este partido todavía no se ha abierto."
        : "Los resultados todavía no están disponibles.";

    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

          <div className="relative z-10">
            <Link
              href={`/match-admin/${matchId}`}
              className="text-sm font-bold text-white/70"
            >
              ← Volver al partido
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Match Admin
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Resultados
            </h1>

            <p className="mt-2 text-sm text-white/60">
              Valoraciones y MVP del partido
            </p>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-50 text-2xl">
              ⏳
            </div>

            <h2 className="mt-4 text-lg font-black text-zinc-950">
              Resultados no disponibles
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-zinc-500">
              {message}
            </p>
          </section>
        </div>
      </main>
    );
  }

  const playerName = (
    entry: (typeof result.rows)[number]["entry"],
  ) =>
    entry.player
      ? `${entry.player.first_name} ${
          entry.player.last_name ??
          ""
        }`.trim()
      : "Jugador no disponible";

  const provisional =
    result.phase ===
    "provisional";

  const sortedRows =
    result.rows
      .slice()
      .sort(
        (a, b) => {
          const aRating =
            a.rating
              .final_rating ??
            -1;

          const bRating =
            b.rating
              .final_rating ??
            -1;

          return (
            bRating -
            aRating
          );
        },
      );

  const ratedPlayers =
    result.rows.filter(
      ({ rating }) =>
        rating.status ===
        "rated",
    ).length;

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/match-admin/${matchId}`}
            className="text-sm font-bold text-white/70"
          >
            ← Volver al partido
          </Link>

          <div className="mt-7 flex items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                Match Admin
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                {provisional
                  ? "Resultados provisionales"
                  : "Resultados finales"}
              </h1>

              <p className="mt-2 text-sm text-white/60">
                Valoraciones y rendimiento del partido
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${
                provisional
                  ? "bg-amber-400 text-amber-950"
                  : "bg-white text-[#0f3d2e]"
              }`}
            >
              {provisional
                ? "En directo"
                : "Final"}
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* AVISO PROVISIONAL */}
        {provisional && (
          <section className="mt-5 rounded-[1.3rem] bg-amber-50 p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">
                ⏳
              </div>

              <div>
                <p className="font-black text-amber-900">
                  Resultados provisionales
                </p>

                <p className="mt-1 text-xs leading-5 text-amber-700">
                  Las puntuaciones pueden cambiar mientras llegan nuevos votos.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* MVP */}
        <section className="relative mt-5 overflow-hidden rounded-[1.8rem] bg-zinc-950 p-5 text-white shadow-xl">
          <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full border-[24px] border-white/5" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                  {provisional
                    ? "MVP provisional"
                    : "Jugador del partido"}
                </p>

                <h2 className="mt-1 text-xl font-black">
                  MVP
                </h2>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-xl">
                ★
              </div>
            </div>

            {result.mvp.status ===
            "none" ? (
              <div className="mt-6 rounded-[1.3rem] bg-white/5 p-4">
                <p className="font-black">
                  Sin MVP disponible
                </p>

                <p className="mt-1 text-sm leading-5 text-white/50">
                  Todavía no hay jugadores con minutos y votos suficientes.
                </p>
              </div>
            ) : (
              <div className="mt-5">
                {result.mvp.status ===
                  "shared" && (
                  <span className="mb-3 inline-flex rounded-full bg-amber-400/15 px-3 py-1 text-[9px] font-black uppercase tracking-wide text-amber-300">
                    MVP compartido
                  </span>
                )}

                <div className="space-y-2">
                  {result.mvp.players.map(
                    (
                      player,
                    ) => {
                      const row =
                        result.rows.find(
                          (
                            item,
                          ) =>
                            item
                              .entry
                              .player_id ===
                            player.player_id,
                        );

                      return (
                        <div
                          key={
                            player.player_id
                          }
                          className="flex items-center gap-3 rounded-[1.3rem] bg-white/10 p-4"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white font-black text-zinc-950">
                            {row?.entry
                              .player
                              ?.shirt_number ??
                              "—"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-lg font-black">
                              {row
                                ? playerName(
                                    row.entry,
                                  )
                                : "Jugador no disponible"}
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-white/45">
                              {row?.entry
                                .player
                                ?.position ??
                                "Sin posición"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-3xl font-black">
                              {display(
                                player.final_rating,
                              )}
                            </p>

                            <p className="text-[9px] font-black uppercase tracking-wide text-white/35">
                              Nota final
                            </p>
                          </div>
                        </div>
                      );
                    },
                  )}
                </div>
              </div>
            )}
          </div>
        </section>

        {/* RESUMEN */}
        <section className="mt-4 grid grid-cols-3 gap-2">
          <Summary
            value={
              result.rows.length
            }
            label="Jugadores"
          />

          <Summary
            value={
              ratedPlayers
            }
            label="Valorados"
            highlight
          />

          <Summary
            value={
              result.minimumVotes
            }
            label="Mín. votos"
          />
        </section>

        {/* RANKING */}
        <section className="mt-8">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Clasificación
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Jugadores
              </h2>

              <p className="mt-1 text-xs text-zinc-500">
                Ordenados por nota final
              </p>
            </div>

            <span className="rounded-full bg-white px-3 py-1.5 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
              {result.rows.length}
            </span>
          </div>

          {result.rows.length ===
          0 ? (
            <div className="mt-4 rounded-[1.5rem] bg-white p-5 text-sm text-zinc-500 shadow-sm ring-1 ring-black/5">
              No hay jugadores en la convocatoria.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sortedRows.map(
                (
                  {
                    entry,
                    rating,
                  },
                  index,
                ) => (
                  <article
                    key={
                      entry.id
                    }
                    className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5"
                  >
                    {/* JUGADOR */}
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="relative shrink-0">
                          <div
                            className={`flex h-12 w-12 items-center justify-center rounded-full font-black ${
                              index ===
                              0
                                ? "bg-[#0f3d2e] text-white"
                                : "bg-zinc-100 text-zinc-950"
                            }`}
                          >
                            {entry.player
                              ?.shirt_number ??
                              "—"}
                          </div>

                          <span className="absolute -left-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-950 px-1 text-[9px] font-black text-white shadow">
                            {index +
                              1}
                          </span>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="truncate font-black text-zinc-950">
                            {playerName(
                              entry,
                            )}
                          </h3>

                          <p className="mt-1 truncate text-xs font-semibold text-zinc-400">
                            {entry.player
                              ?.position ??
                              "Sin posición"}

                            {entry.team
                              ?.name
                              ? ` · ${entry.team.name}`
                              : ""}
                          </p>
                        </div>

                        <div className="shrink-0 text-right">
                          <p
                            className={`text-3xl font-black ${
                              rating.final_rating ===
                              null
                                ? "text-zinc-300"
                                : "text-[#0f3d2e]"
                            }`}
                          >
                            {display(
                              rating.final_rating,
                            )}
                          </p>

                          <p className="text-[8px] font-black uppercase tracking-wide text-zinc-400">
                            Nota final
                          </p>
                        </div>
                      </div>

                      {/* COMPONENTES DE NOTA */}
                      <div className="mt-5 grid grid-cols-3 gap-2">
                        <Stat
                          label="Panel"
                          value={display(
                            rating.panel_average,
                          )}
                        />

                        <Stat
                          label="Estadística"
                          value={display(
                            rating.statistical_score,
                          )}
                        />

                        <Stat
                          label="Votos"
                          value={String(
                            rating.vote_count,
                          )}
                        />
                      </div>

                      {/* ESTADÍSTICAS */}
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        <SmallStat
                          label="Min."
                          value={
                            entry.minutes_played
                          }
                        />

                        <SmallStat
                          label="Goles"
                          value={
                            entry.goals
                          }
                        />

                        <SmallStat
                          label="Asist."
                          value={
                            entry.assists
                          }
                        />

                        <SmallStat
                          label="Tarj."
                          value={
                            entry.yellow_cards +
                            entry.red_cards
                          }
                        />
                      </div>
                    </div>

                    {rating.status !==
                      "rated" && (
                      <div className="border-t border-amber-100 bg-amber-50 px-4 py-3">
                        <div className="flex items-start gap-2">
                          <span className="mt-0.5 text-xs">
                            ⚠
                          </span>

                          <p className="text-xs font-semibold leading-5 text-amber-800">
                            {
                              rating.reason
                            }
                          </p>
                        </div>
                      </div>
                    )}
                  </article>
                ),
              )}
            </div>
          )}
        </section>

        {/* INFORMACIÓN */}
        <section className="mt-6 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Cálculo
          </p>

          <p className="mt-1 font-black text-[#0b2f23]">
            Valoración del partido
          </p>

          <p className="mt-1 text-xs leading-5 text-[#557368]">
            La nota final combina la valoración del panel con la puntuación estadística. Se requieren al menos{" "}
            <strong>
              {result.minimumVotes}
            </strong>{" "}
            votos para que un jugador pueda obtener una valoración válida.
          </p>
        </section>
      </div>
    </main>
  );
}

function Summary({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.3rem] px-2 py-4 text-center shadow-sm ring-1 ${
        highlight
          ? "bg-[#e8f2ed] ring-[#d7e8df]"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-2xl font-black ${
          highlight
            ? "text-[#0f3d2e]"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1rem] bg-zinc-100 p-3 text-center">
      <p className="text-lg font-black text-zinc-950">
        {value}
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-zinc-100 p-2.5 text-center">
      <p className="font-black text-zinc-950">
        {value}
      </p>

      <p className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}