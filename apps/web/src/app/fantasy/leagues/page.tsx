import Link from "next/link";

import {
  requireUser,
} from "@/lib/auth";

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
    <main className="min-h-screen bg-[#f2f4f2] pb-28">
      <div className="mx-auto max-w-xl">
        {/* CABECERA */}
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-6 text-white shadow-lg">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

          <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

          <div className="relative z-10">
            <Link
              href="/fantasy"
              className="text-xs font-bold text-white/65"
            >
              ← Inicio
            </Link>

            <p className="mt-6 text-[9px] font-black uppercase tracking-[0.22em] text-white/50">
              Fantasy Regional
            </p>

            <div className="mt-1 flex items-end justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight">
                  Mis ligas
                </h1>

                <p className="mt-1 text-sm text-white/60">
                  Elige la competición que quieres consultar.
                </p>
              </div>

              <div className="flex h-11 min-w-11 items-center justify-center rounded-2xl bg-white/10 px-3 text-sm font-black">
                {leagues.length}
              </div>
            </div>
          </div>
        </header>

        <div className="px-4">
          {/* CREAR / UNIRSE */}
          <section className="mt-5 grid grid-cols-2 gap-3">
            <Link
              href="/fantasy/leagues/create"
              className="rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
                +
              </div>

              <p className="mt-3 font-black text-zinc-950">
                Crear liga
              </p>

              <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                Nueva competición
              </p>
            </Link>

            <Link
              href="/fantasy/leagues/join"
              className="rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
                #
              </div>

              <p className="mt-3 font-black text-zinc-950">
                Unirme
              </p>

              <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                Introducir código
              </p>
            </Link>
          </section>

          {/* LISTA */}
          <section className="mt-7">
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Competiciones
                </p>

                <h2 className="mt-1 text-xl font-black text-zinc-950">
                  Tus ligas
                </h2>
              </div>

              <span className="text-[10px] font-bold text-zinc-400">
                {leagues.length}
              </span>
            </div>

            {leagues.length ===
            0 ? (
              <div className="mt-3 rounded-[1.4rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
                  🏆
                </div>

                <p className="mt-4 font-black text-zinc-950">
                  Todavía no tienes ligas
                </p>

                <p className="mt-2 text-xs leading-5 text-zinc-500">
                  Crea una nueva o únete mediante un código de invitación.
                </p>
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                {leagues.map(
                  (league) => (
                    <Link
                      key={
                        league.id
                      }
                      href={`/fantasy?league=${encodeURIComponent(
                        league.id,
                      )}`}
                      className="group flex items-center justify-between gap-4 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5 active:scale-[0.99]"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
                          🏆
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate font-black text-zinc-950">
                            {
                              league.name
                            }
                          </h3>

                          <p className="mt-1 truncate text-[10px] font-semibold text-zinc-500">
                            {league.team
                              ?.name ??
                              "Equipo no disponible"}
                          </p>

                          <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-zinc-400">
                            Código{" "}
                            {
                              league.code
                            }
                          </p>
                        </div>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 font-black text-white transition group-hover:translate-x-1">
                        →
                      </span>
                    </Link>
                  ),
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}