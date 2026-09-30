import Link from "next/link";

import { requireUser } from "@/lib/auth";

import {
  getFantasyLeagueById,
  getUserFantasyLeagues,
} from "@/data/fantasy-leagues";

export default async function FantasyLeaguesPage() {
  const user =
    await requireUser();

  const memberships =
    await getUserFantasyLeagues(
      user.id,
    );

  const leagues = (
    await Promise.all(
      memberships.map(
        (membership) =>
          getFantasyLeagueById(
            membership.league_id,
          ),
      ),
    )
  ).filter(
    (
      league,
    ): league is NonNullable<
      Awaited<
        ReturnType<
          typeof getFantasyLeagueById
        >
      >
    > =>
      league !== null,
  );

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-5 text-white">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/fantasy"
            className="inline-flex items-center text-sm font-bold text-white/70"
          >
            ← Inicio
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
            Fantasy Regional
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Mis ligas
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
            Crea una liga privada o únete con un código.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        <section className="relative z-10 -mt-1 grid grid-cols-2 gap-3 pt-5">
          <Link
            href="/fantasy/leagues/create"
            className="rounded-[1.4rem] bg-zinc-950 p-4 text-white shadow-lg active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-2xl font-black">
              +
            </div>

            <p className="mt-5 text-lg font-black">
              Crear liga
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Crea una liga privada e invita a otros.
            </p>
          </Link>

          <Link
            href="/fantasy/leagues/join"
            className="rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl font-black text-[#0f3d2e]">
              #
            </div>

            <p className="mt-5 text-lg font-black text-zinc-950">
              Unirme
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Entra con el código de una liga.
            </p>
          </Link>
        </section>

        <section className="mt-8">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Competición
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Tus ligas
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
              {leagues.length}
            </span>
          </div>

          {leagues.length ===
          0 ? (
            <div className="mt-4 rounded-[1.5rem] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
                🏆
              </div>

              <p className="mt-4 font-black text-zinc-950">
                Todavía no tienes ligas
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Crea una nueva o únete a una existente mediante su código.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {leagues.map(
                (
                  league,
                  index,
                ) => (
                  <Link
                    key={
                      league.id
                    }
                    href={`/fantasy/leagues/${league.id}`}
                    className="group block overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="flex min-w-0 items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
                          {index + 1}
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-base font-black text-zinc-950">
                            {
                              league.name
                            }
                          </h3>

                          <p className="mt-1 truncate text-xs font-medium text-zinc-500">
                            {league.team
                              ?.name ??
                              "Equipo no disponible"}
                          </p>

                          <div className="mt-2 inline-flex items-center rounded-full bg-zinc-100 px-2.5 py-1">
                            <span className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                              Código
                            </span>

                            <span className="ml-2 text-[10px] font-black tracking-wider text-zinc-700">
                              {
                                league.code
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 font-black text-white transition group-hover:translate-x-1">
                        →
                      </span>
                    </div>
                  </Link>
                ),
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}