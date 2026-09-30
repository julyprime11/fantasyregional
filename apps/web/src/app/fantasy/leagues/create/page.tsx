import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getTeams } from "@/data/teams";
import CreateLeagueForm from "./create-league-form";

export default async function CreateFantasyLeaguePage() {
  const user = await requireUser();
  const teams = await getTeams();

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
      <header>
        <Link
          href="/fantasy/leagues"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a mis ligas
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Crear liga
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Crea una liga privada y compártela mediante código.
        </p>
      </header>

      {teams.length === 0 ? (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="font-semibold text-zinc-950">
            No hay equipos disponibles.
          </p>
        </section>
      ) : (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <CreateLeagueForm
            teams={teams.map((team) => ({
              id: team.id,
              name: team.name,
            }))}
            userId={user.id}
          />
        </section>
      )}
    </main>
  );
}