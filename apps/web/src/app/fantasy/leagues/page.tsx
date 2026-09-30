import Link from "next/link";

import { requireUser } from "@/lib/auth";
import {
  getFantasyLeagueById,
  getUserFantasyLeagues,
} from "@/data/fantasy-leagues";

export default async function FantasyLeaguesPage() {
  const user = await requireUser();

  const memberships =
    await getUserFantasyLeagues(user.id);

  const leagues = (
    await Promise.all(
      memberships.map((membership) =>
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
    > => league !== null,
  );

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
      <header>
        <Link
          href="/fantasy"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Mis ligas
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Crea una liga con tus amigos o únete mediante un código.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-2 gap-3">
        <Link
          href="/fantasy/leagues/create"
          className="flex min-h-28 flex-col justify-between rounded-2xl bg-zinc-950 p-5 text-white shadow-sm"
        >
          <span className="text-2xl font-bold">
            +
          </span>

          <div>
            <p className="font-bold">
              Crear liga
            </p>

            <p className="mt-1 text-xs text-zinc-300">
              Invita después a otros usuarios
            </p>
          </div>
        </Link>

        <Link
          href="/fantasy/leagues/join"
          className="flex min-h-28 flex-col justify-between rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <span className="text-2xl font-bold text-zinc-950">
            #
          </span>

          <div>
            <p className="font-bold text-zinc-950">
              Unirme
            </p>

            <p className="mt-1 text-xs text-zinc-500">
              Introduce el código de una liga
            </p>
          </div>
        </Link>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-950">
            Tus ligas
          </h2>

          <span className="text-sm text-zinc-500">
            {leagues.length}
          </span>
        </div>

        {leagues.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-6 text-center shadow-sm ring-1 ring-zinc-200">
            <p className="font-semibold text-zinc-950">
              Todavía no tienes ligas
            </p>

            <p className="mt-2 text-sm text-zinc-500">
              Crea una nueva o únete a una existente mediante su código.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {leagues.map((league) => (
              <Link
                key={league.id}
                href={`/fantasy/leagues/${league.id}`}
                className="flex min-h-20 items-center justify-between rounded-2xl bg-white px-5 shadow-sm ring-1 ring-zinc-200"
              >
                <div>
                  <h3 className="font-bold text-zinc-950">
                    {league.name}
                  </h3>

                  <p className="mt-1 text-sm text-zinc-500">
                    {league.team?.name ??
                      "Equipo no disponible"}
                  </p>

                  <p className="mt-1 text-xs font-medium text-zinc-400">
                    Código: {league.code}
                  </p>
                </div>

                <span className="text-xl text-zinc-400">
                  →
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}