import Link from "next/link";

import { requireUser } from "@/lib/auth";
import JoinLeagueForm from "./join-league-form";

export default async function JoinFantasyLeaguePage() {
  await requireUser();

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
          Unirme a una liga
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Introduce el código de invitación de una liga existente.
        </p>
      </header>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <JoinLeagueForm />
      </section>
    </main>
  );
}