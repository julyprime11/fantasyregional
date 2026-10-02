import Link from "next/link";

import {
  notFound,
} from "next/navigation";

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

const signed = (
  value: number,
): string =>
  value > 0
    ? `+${value}`
    : String(value);

export default async function MatchAdminResultsPage({
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

  let matchId:
    string;

  try {
    matchId =
      parseMatchId(
        id,
      );
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
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
        <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.65rem)] text-white">
          <div className="relative z-10">
            <Link
              href={`/match-admin/${matchId}`}
              className="text-xs font-bold text-white/65"
            >
              ← Partido
            </Link>

            <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
              Match Admin
            </p>

            <h1 className="mt-0.5 text-[2rem] font-black">
              Resultados
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-4 rounded-[1.2rem] bg-red-50 p-4">
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
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
        <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.65rem)] text-white shadow-lg">
          <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

          <div className="relative z-10">
            <Link
              href={`/match-admin/${matchId}`}
              className="text-xs font-bold text-white/65"
            >
              ← Partido
            </Link>

            <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
              Match Admin
            </p>

            <h1 className="mt-0.5 text-[2rem] font-black">
              Resultados
            </h1>

            <p className="mt-0.5 text-xs text-white/55">
              Valoraciones y puntos Fantasy
            </p>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-4 rounded-[1.2rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-xl">
              ⏳
            </div>

            <h2 className="mt-3 text-lg font-black text-zinc-950">
              Resultados no disponibles
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-zinc-500">
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

  /*
   * En la nueva pantalla ordenamos
   * por puntos Fantasy.
   *
   * Si todavía no existe puntuación
   * Fantasy, usamos la nota humana.
   */
  const sortedRows =
    result.rows
      .slice()
      .sort(
        (
          a,
          b,
        ) => {
          const aPoints =
            a.fantasy?.points ??
            Number.NEGATIVE_INFINITY;

          const bPoints =
            b.fantasy?.points ??
            Number.NEGATIVE_INFINITY;

          if (
            bPoints !==
            aPoints
          ) {
            return (
              bPoints -
              aPoints
            );
          }

          return (
            (
              b.rating
                .final_rating ??
              -1
            ) -
            (
              a.rating
                .final_rating ??
              -1
            )
          );
        },
      );

  const ratedPlayers =
    result.rows.filter(
      (
        {
          rating,
        },
      ) =>
        rating.status ===
        "rated",
    ).length;

  const totalFantasyPoints =
    result.rows.reduce(
      (
        total,
        row,
      ) =>
        total +
        (
          row.fantasy
            ?.points ??
          0
        ),
      0,
    );

  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
      {/* HEADER */}
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.65rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -left-14 bottom-[-60px] h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/match-admin/${matchId}`}
              className="text-xs font-bold text-white/65"
            >
              ← Partido
            </Link>

            <span
              className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${
                provisional
                  ? "bg-amber-400 text-amber-950"
                  : "bg-white text-[#0f3d2e]"
              }`}
            >
              {provisional
                ? "Provisional"
                : "Final"}
            </span>
          </div>

          <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Match Admin
          </p>

          <h1 className="mt-0.5 text-[2rem] font-black tracking-tight">
            {provisional
              ? "Resultados provisionales"
              : "Resultados finales"}
          </h1>

          <p className="mt-0.5 text-xs text-white/55">
            Valoración y puntos Fantasy del partido
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* AVISO PROVISIONAL */}
        {provisional && (
          <section className="mt-3 rounded-[1rem] bg-amber-50 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs">
                ⏳
              </div>

              <div>
                <p className="text-xs font-black text-amber-900">
                  Resultados provisionales
                </p>

                <p className="mt-0.5 text-[10px] leading-4 text-amber-700">
                  Las notas y los puntos pueden cambiar mientras lleguen nuevos votos.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* MVP */}
        <section className="relative mt-3 overflow-hidden rounded-[1.4rem] bg-zinc-950 p-4 text-white shadow-lg">
          <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full border-[22px] border-white/5" />

          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/40">
                  {provisional
                    ? "MVP provisional"
                    : "Jugador del partido"}
                </p>

                <h2 className="mt-0.5 text-lg font-black">
                  MVP
                </h2>
              </div>

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg">
                ★
              </div>
            </div>

            {result.mvp.status ===
            "none" ? (
              <div className="mt-4 rounded-[1rem] bg-white/5 p-3">
                <p className="text-sm font-black">
                  Sin MVP disponible
                </p>

                <p className="mt-1 text-[10px] leading-4 text-white/50">
                  Todavía no hay jugadores con votos suficientes.
                </p>
              </div>
            ) : (
              <div className="mt-3">
                {result.mvp.status ===
                  "shared" && (
                  <span className="mb-2 inline-flex rounded-full bg-amber-400/15 px-2 py-1 text-[8px] font-black uppercase tracking-wide text-amber-300">
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
                            item.entry
                              .player_id ===
                            player.player_id,
                        );

                      return (
                        <div
                          key={
                            player.player_id
                          }
                          className="flex items-center gap-3 rounded-[1rem] bg-white/10 p-3"
                        >
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-sm font-black text-zinc-950">
                            {row?.entry
                              .player
                              ?.shirt_number ??
                              "—"}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black">
                              {row
                                ? playerName(
                                    row.entry,
                                  )
                                : "Jugador no disponible"}
                            </p>

                            <p className="mt-0.5 text-[9px] font-semibold text-white/45">
                              {row?.entry
                                .player
                                ?.position ??
                                "Sin posición"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="text-2xl font-black">
                              {display(
                                player.final_rating,
                              )}
                            </p>

                            <p className="text-[7px] font-black uppercase tracking-wide text-white/35">
                              Nota
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
        <section className="mt-3 grid grid-cols-3 gap-2">
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
              totalFantasyPoints
            }
            label="Pts Fantasy"
          />
        </section>

        {/* RANKING */}
        <section className="mt-6">
          <div className="flex items-end justify-between px-0.5">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Clasificación
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                Jugadores
              </h2>

              <p className="mt-0.5 text-[10px] text-zinc-500">
                Ordenados por puntos Fantasy
              </p>
            </div>

            <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
              {result.rows.length}
            </span>
          </div>

          {result.rows.length ===
          0 ? (
            <div className="mt-3 rounded-[1.2rem] bg-white p-4 text-sm text-zinc-500 shadow-sm ring-1 ring-black/5">
              No hay jugadores en la convocatoria.
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {sortedRows.map(
                (
                  {
                    entry,
                    rating,
                    fantasy,
                  },
                  index,
                ) => {
                  const players =
                    rating.groups.players;

                  const directors =
                    rating.groups.directors;

                  const coaches =
                    rating.groups.coaches;

                  return (
                    <article
                      key={
                        entry.id
                      }
                      className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-black/5"
                    >
                      {/* CABECERA JUGADOR */}
                      <div className="p-3">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-black ${
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

                            <span className="absolute -left-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-zinc-950 px-1 text-[7px] font-black text-white shadow">
                              {index +
                                1}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="truncate text-sm font-black text-zinc-950">
                              {playerName(
                                entry,
                              )}
                            </h3>

                            <p className="mt-0.5 truncate text-[9px] font-semibold text-zinc-400">
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
                              className={`text-2xl font-black ${
                                fantasy
                                  ? fantasy.points <
                                    0
                                    ? "text-red-600"
                                    : "text-[#0f3d2e]"
                                  : "text-zinc-300"
                              }`}
                            >
                              {fantasy
                                ? signed(
                                    fantasy.points,
                                  )
                                : "—"}
                            </p>

                            <p className="text-[7px] font-black uppercase tracking-wide text-zinc-400">
                              Pts Fantasy
                            </p>
                          </div>
                        </div>

                        {/* VOTACIÓN POR COLECTIVOS */}
                        <div className="mt-3 rounded-[1rem] bg-[#f6f7f6] p-2.5">
                          <div className="flex items-center justify-between">
                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">
                              Votación
                            </p>

                            <div className="text-right">
                              <p className="text-sm font-black text-[#0f3d2e]">
                                {display(
                                  rating.panel_average,
                                )}
                              </p>

                              <p className="text-[6px] font-black uppercase tracking-wide text-zinc-400">
                                Nota ponderada
                              </p>
                            </div>
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-1.5">
                            <VoteGroup
                              label="Jugadores"
                              average={
                                players.average
                              }
                              votes={
                                players.vote_count
                              }
                              weight={
                                players.applied_weight
                              }
                            />

                            <VoteGroup
                              label="Directiva"
                              average={
                                directors.average
                              }
                              votes={
                                directors.vote_count
                              }
                              weight={
                                directors.applied_weight
                              }
                            />

                            <VoteGroup
                              label="Entrenadores"
                              average={
                                coaches.average
                              }
                              votes={
                                coaches.vote_count
                              }
                              weight={
                                coaches.applied_weight
                              }
                            />
                          </div>

                          <div className="mt-2 flex items-center justify-between rounded-xl bg-white px-2.5 py-2 ring-1 ring-black/5">
                            <div>
                              <p className="text-[8px] font-black uppercase tracking-wide text-zinc-400">
                                Nota redondeada
                              </p>

                              <p className="mt-0.5 text-sm font-black text-zinc-950">
                                {rating.rounded_rating ??
                                  "—"}
                              </p>
                            </div>

                            <div className="text-right">
                              <p className="text-[8px] font-black uppercase tracking-wide text-zinc-400">
                                Puntos valoración
                              </p>

                              <p className="mt-0.5 text-sm font-black text-[#0f3d2e]">
                                {fantasy
                                  ? signed(
                                      fantasy.breakdown.rating,
                                    )
                                  : "—"}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ESTADÍSTICAS */}
                        <div className="mt-2.5 grid grid-cols-5 gap-1.5">
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
                            label="TA"
                            value={
                              entry.yellow_cards
                            }
                          />

                          <SmallStat
                            label="TR"
                            value={
                              entry.red_cards
                            }
                          />
                        </div>

                        {/* DESGLOSE FANTASY */}
                        {fantasy && (
                          <div className="mt-2.5 rounded-[1rem] border border-zinc-100 p-2.5">
                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">
                              Desglose Fantasy
                            </p>

                            <div className="mt-2 space-y-1.5">
                              <PointRow
                                label="Minutos"
                                value={
                                  fantasy.breakdown.minutes
                                }
                              />

                              <PointRow
                                label="Goles"
                                value={
                                  fantasy.breakdown.goals
                                }
                              />

                              <PointRow
                                label="Asistencias"
                                value={
                                  fantasy.breakdown.assists
                                }
                              />

                              <PointRow
                                label="Portería a cero"
                                value={
                                  fantasy.breakdown.clean_sheet
                                }
                              />

                              <PointRow
                                label="Tarjetas"
                                value={
                                  fantasy.breakdown.cards
                                }
                              />

                              <PointRow
                                label="Valoración"
                                value={
                                  fantasy.breakdown.rating
                                }
                              />
                            </div>

                            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
                              <span className="text-xs font-black text-zinc-950">
                                TOTAL
                              </span>

                              <span
                                className={`text-lg font-black ${
                                  fantasy.points <
                                  0
                                    ? "text-red-600"
                                    : "text-[#0f3d2e]"
                                }`}
                              >
                                {signed(
                                  fantasy.points,
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {rating.status !==
                        "rated" && (
                        <div className="border-t border-amber-100 bg-amber-50 px-3 py-2.5">
                          <p className="text-[10px] font-semibold leading-4 text-amber-800">
                            ⚠{" "}
                            {
                              rating.reason
                            }
                          </p>
                        </div>
                      )}
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* EXPLICACIÓN */}
        <section className="mt-5 rounded-[1rem] bg-[#e8f2ed] p-3">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Cálculo
          </p>

          <p className="mt-0.5 text-xs font-black text-[#0b2f23]">
            Sistema de puntuación Fantasy
          </p>

          <p className="mt-1 text-[10px] leading-4 text-[#557368]">
            La nota de votación se obtiene calculando primero la media de cada colectivo y aplicando sus pesos. Si algún colectivo no ha votado, su peso se redistribuye proporcionalmente entre los colectivos con votos.
          </p>

          <p className="mt-1.5 text-[10px] leading-4 text-[#557368]">
            Después se suman los puntos por minutos, goles, asistencias, portería a cero, tarjetas y valoración. El total puede ser positivo o negativo.
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
      className={`rounded-[1rem] px-2 py-3 text-center shadow-sm ring-1 ${
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

      <p className="mt-0.5 text-[7px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function VoteGroup({
  label,
  average,
  votes,
  weight,
}: {
  label: string;
  average: number | null;
  votes: number;
  weight: number;
}) {
  return (
    <div className="rounded-xl bg-white p-2 text-center ring-1 ring-black/5">
      <p className="text-sm font-black text-zinc-950">
        {average ===
        null
          ? "—"
          : average.toFixed(
              2,
            )}
      </p>

      <p className="mt-0.5 truncate text-[6px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>

      <p className="mt-0.5 text-[6px] font-bold text-zinc-400">
        {votes}{" "}
        {votes ===
        1
          ? "voto"
          : "votos"}
      </p>

      {average !==
        null && (
          <p className="mt-0.5 text-[6px] font-black text-[#0f3d2e]">
            {Math.round(
              weight *
                100,
            )}
            %
          </p>
        )}
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
    <div className="rounded-lg border border-zinc-100 p-1.5 text-center">
      <p className="text-xs font-black text-zinc-950">
        {value}
      </p>

      <p className="mt-0.5 text-[6px] font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}

function PointRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] font-semibold text-zinc-500">
        {label}
      </span>

      <span
        className={`text-[10px] font-black ${
          value <
          0
            ? "text-red-600"
            : value >
                0
              ? "text-[#0f3d2e]"
              : "text-zinc-400"
        }`}
      >
        {signed(
          value,
        )}
      </span>
    </div>
  );
}