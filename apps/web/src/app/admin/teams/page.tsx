import Link from "next/link";

import {
  connection,
} from "next/server";

import {
  getClubs,
} from "@/data/clubs";

import {
  getTeams,
} from "@/data/teams";

import {
  createTeamAction,
} from "../actions";

import {
  CreateForm,
} from "../create-form";

export default async function TeamsPage() {
  await connection();

  let loaded;

  try {
    loaded =
      await Promise.all([
        getClubs(),
        getTeams(),
      ]);
  } catch {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No se pudieron cargar los equipos y clubs.
          </p>

          <p className="mt-2 text-sm text-red-600">
            Inténtalo de nuevo.
          </p>
        </section>
      </main>
    );
  }

  const [
    clubs,
    teams,
  ] =
    loaded;

  const clubNames =
    new Map(
      clubs.map(
        (club) => [
          club.id,
          club.name,
        ],
      ),
    );

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/admin"
            className="text-[11px] font-bold text-white/65"
          >
            ← Administración
          </Link>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Estructura deportiva
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Equipos
              </h1>

              <p className="mt-1 text-xs text-white/60">
                Gestiona equipos y categorías
              </p>
            </div>

            <div className="rounded-[1rem] bg-white/10 px-3 py-2 text-center">
              <p className="text-2xl font-black">
                {
                  teams.length
                }
              </p>

              <p className="text-[7px] font-black uppercase tracking-wide text-white/45">
                equipos
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
                Crear equipo
              </h2>
            </div>
          </div>

          {clubs.length ===
            0 && (
            <div className="mt-4 rounded-[1rem] bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-800">
                Primero debes crear un club.
              </p>

              <Link
                href="/admin/clubs"
                className="mt-2 inline-flex text-xs font-black text-amber-800 underline"
              >
                Ir a clubs
              </Link>
            </div>
          )}

          <div className="mt-5">
            <CreateForm
              action={
                createTeamAction
              }
              disabled={
                clubs.length ===
                0
              }
              submitLabel="Crear equipo"
              fields={[
                {
                  name:
                    "club_id",
                  label:
                    "Club",
                  required:
                    true,
                  options:
                    clubs.map(
                      (
                        club,
                      ) => ({
                        value:
                          club.id,
                        label:
                          club.name,
                      }),
                    ),
                },
                {
                  name:
                    "name",
                  label:
                    "Nombre",
                  required:
                    true,
                },
                {
                  name:
                    "category",
                  label:
                    "Categoría",
                },
              ]}
            />
          </div>
        </section>

        <section className="mt-7">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Estructura
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                Equipos existentes
              </h2>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">
              {
                teams.length
              }{" "}
              equipos
            </span>
          </div>

          {teams.length ===
          0 ? (
            <div className="mt-3 rounded-[1.3rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f2ed] text-xl">
                🛡️
              </div>

              <p className="mt-3 font-black text-zinc-950">
                No hay equipos todavía
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-2">
              {teams.map(
                (team) => (
                  <article
                    key={
                      team.id
                    }
                    className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-black/5"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-lg text-white">
                        ⚽
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-zinc-950">
                          {
                            team.name
                          }
                        </p>

                        <p className="mt-0.5 truncate text-[10px] font-semibold text-zinc-500">
                          {
                            clubNames.get(
                              team.club_id,
                            ) ??
                            "Club no disponible"
                          }
                        </p>

                        <p className="mt-1 text-[8px] font-black uppercase tracking-wide text-[#557368]">
                          {team.category ??
                            "Sin categoría"}
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