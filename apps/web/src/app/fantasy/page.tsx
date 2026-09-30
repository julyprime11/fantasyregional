import Link from "next/link";

import { requireUser } from "@/lib/auth";

export default async function FantasyPage() {
  const user = await requireUser();

  const displayName =
    user.user_metadata?.display_name ??
    user.email?.split("@")[0] ??
    "Jugador";

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
      <header>
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-2 text-3xl font-bold text-zinc-950">
          Hola, {displayName}
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Gestiona tus ligas Fantasy y prepara tu equipo para la próxima jornada.
        </p>
      </header>

      <section className="mt-8">
        <Link
          href="/fantasy/leagues"
          className="flex min-h-24 items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-white shadow-sm"
        >
          <div>
            <p className="text-lg font-bold">
              Mis ligas
            </p>

            <p className="mt-1 text-sm text-zinc-300">
              Consulta tus ligas, clasificación y jornadas
            </p>
          </div>

          <span className="text-2xl">
            →
          </span>
        </Link>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/fantasy/leagues/create"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <span className="text-2xl font-black text-zinc-950">
            +
          </span>

          <p className="mt-5 font-bold text-zinc-950">
            Crear liga
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Crea una liga privada
          </p>
        </Link>

        <Link
          href="/fantasy/leagues/join"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <span className="text-2xl font-black text-zinc-950">
            #
          </span>

          <p className="mt-5 font-bold text-zinc-950">
            Unirme
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Entra mediante un código
          </p>
        </Link>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <p className="text-sm font-semibold text-zinc-950">
          Tu Fantasy
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Elige tu XI para cada partido. Los puntos se calcularán a partir de
          las valoraciones finales de los jugadores.
        </p>
      </section>
    </main>
  );
}