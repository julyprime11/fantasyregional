import Link from "next/link";

import {
  connection,
} from "next/server";

import {
  getMatches,
} from "@/data/matches";

import {
  getTeams,
} from "@/data/teams";

import {
  getCompetitions,
} from "@/data/competitions";

import {
  createMatchAction,
} from "../actions";

import {
  CreateForm,
} from "../create-form";

import {
  matchFields,
  matchStatusLabels,
} from "./fields";

export default async function MatchesPage() {
  await connection();

  let loaded;

  try {
    loaded =
      await Promise.all([
        getMatches(),
        getTeams(),
        getCompetitions(),
      ]);
  } catch {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No se pudieron cargar los partidos.
          </p>

          <p className="mt-2 text-sm text-red-600">
            Inténtalo de nuevo.
          </p>
        </section>
      </main>
    );
  }

  const [
    matches,
    teams,
    competitions,
  ] =
    loaded;

  const names =
    new Map(
      teams.map(
        (
          team,
        ) => [
          team.id,
          team.name,
        ],
      ),
    );

  const dateFormat =
    new Intl.DateTimeFormat(
      "es-ES",
      {
        weekday:
          "short",

        day:
          "numeric",

        month:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",

        timeZone:
          "UTC",
      },
    );

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/admin"
              className="text-[11px] font-bold text-white/65"
            >
              ← Administración
            </Link>

            <Link
              href="/match-admin"
              className="rounded-xl bg-white/10 px-3 py-2 text-[9px] font-black text-white"
            >
              Match Admin
            </Link>
          </div>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Calendario
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Partidos
              </h1>

              <p className="mt-1 text-xs text-white/60">
                Calendario y configuración
              </p>
            </div>

            <div className="rounded-[1rem] bg-white/10 px-3 py-2 text-center">
              <p className="text-2xl font-black">
                {
                  matches.length
                }
              </p>

              <p className="text-[7px] font-black uppercase tracking-wide text-white/45">
                partidos
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-10">
        <section className="mt-4 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
              +
            </div>

            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
                Nuevo
              </p>

              <h2 className="text-lg font-black text-zinc-950">
                Crear partido
              </h2>
            </div>
          </div>

          <p className="mt-3 text-[10px] leading-4 text-zinc-500">
            Las fechas y horas se introducen y almacenan actualmente en UTC.
          </p>

          {teams.length <
            2 && (
            <div className="mt-4 rounded-[1rem] bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-800">
                Necesitas al menos dos equipos para crear un partido.
              </p>

              <Link
                href="/admin/teams"
                className="mt-2 inline-flex text-xs font-black text-amber-800 underline"
              >
                Gestionar equipos
              </Link>
            </div>
          )}

          <div className="mt-5">
            <CreateForm
              action={
                createMatchAction
              }
              fields={
                matchFields(
                  teams,
                  competitions,
                )
              }
              disabled={
                teams.length <
                2
              }
              initialValues={{
                status:
                  "scheduled",
              }}
              submitLabel="Crear partido"
            />
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Calendario
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                Partidos existentes
              </h2>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">
              {
                matches.length
              }{" "}
              partidos
            </span>
          </div>

          {matches.length ===
          0 ? (
            <div className="mt-3 rounded-[1.3rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f2ed] text-xl">
                ⚽
              </div>

              <p className="mt-3 font-black text-zinc-950">
                No hay partidos todavía
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {matches.map(
                (
                  match,
                ) => {
                  const homeTeam =
                    names.get(
                      match.home_team_id,
                    ) ??
                    "Equipo local";

                  const awayTeam =
                    names.get(
                      match.away_team_id,
                    ) ??
                    "Equipo visitante";

                  const hasResult =
                    match.home_score !==
                      null ||
                    match.away_score !==
                      null;

                  return (
                    <article
                      key={
                        match.id
                      }
                      className="overflow-hidden rounded-[1.3rem] bg-white shadow-sm ring-1 ring-black/5"
                    >
                      <div className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <span className="rounded-full bg-[#e8f2ed] px-2.5 py-1 text-[8px] font-black uppercase tracking-wide text-[#0f3d2e]">
                            {
                              matchStatusLabels[
                                match.status
                              ]
                            }
                          </span>

                          <time
                            dateTime={
                              match.match_date
                            }
                            className="text-[9px] font-bold capitalize text-zinc-400"
                          >
                            {dateFormat.format(
                              new Date(
                                match.match_date,
                              ),
                            )}{" "}
                            UTC
                          </time>
                        </div>

                        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <p className="text-right text-sm font-black leading-5 text-zinc-950">
                            {
                              homeTeam
                            }
                          </p>

                          {hasResult ? (
                            <div className="rounded-xl bg-zinc-950 px-3 py-2 text-white">
                              <p className="whitespace-nowrap text-lg font-black">
                                {match.home_score ??
                                  "—"}

                                <span className="mx-1.5 text-zinc-500">
                                  -
                                </span>

                                {match.away_score ??
                                  "—"}
                              </p>
                            </div>
                          ) : (
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-950 text-[9px] font-black text-white">
                              VS
                            </div>
                          )}

                          <p className="text-left text-sm font-black leading-5 text-zinc-950">
                            {
                              awayTeam
                            }
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 bg-zinc-50/70 p-3">
                        <Link
                          href={`/admin/matches/${match.id}/edit`}
                          className="flex min-h-11 items-center justify-center rounded-[0.9rem] bg-white px-3 text-[10px] font-black text-zinc-700 shadow-sm ring-1 ring-black/5"
                        >
                          Editar
                        </Link>

                        <Link
                          href={`/admin/matches/${match.id}`}
                          className="flex min-h-11 items-center justify-center rounded-[0.9rem] bg-[#0f3d2e] px-3 text-[10px] font-black text-white"
                        >
                          Gestionar →
                        </Link>
                      </div>
                    </article>
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