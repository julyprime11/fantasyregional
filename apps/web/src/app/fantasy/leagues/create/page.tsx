import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { getTeams } from "@/data/teams";

import CreateLeagueForm from "./create-league-form";

export default async function CreateFantasyLeaguePage() {
  const user =
    await requireUser();

  const teams =
    await getTeams();

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/fantasy/leagues"
            className="inline-flex items-center text-sm font-bold text-white/70"
          >
            ← Mis ligas
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            Fantasy Regional
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Crear liga
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
            Crea una competición privada, elige tu equipo y comparte el código con tus amigos.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        {teams.length === 0 ? (
          <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
              ⚽
            </div>

            <p className="mt-4 font-black text-zinc-950">
              No hay equipos disponibles
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Necesitas al menos un equipo registrado para poder crear una liga Fantasy.
            </p>
          </section>
        ) : (
          <>
            <section className="mt-5 grid grid-cols-3 gap-2">
              <Step
                number="1"
                label="Liga"
                active
              />

              <Step
                number="2"
                label="Equipo"
              />

              <Step
                number="3"
                label="Código"
              />
            </section>

            <CreateLeagueForm
              teams={teams.map(
                (team) => ({
                  id: team.id,
                  name: team.name,
                }),
              )}
              userId={user.id}
            />
          </>
        )}
      </div>
    </main>
  );
}

function Step({
  number,
  label,
  active = false,
}: {
  number: string;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl px-3 py-3 text-center ring-1 ${
        active
          ? "bg-[#e8f2ed] ring-[#d7e8df]"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-lg font-black ${
          active
            ? "text-[#0f3d2e]"
            : "text-zinc-400"
        }`}
      >
        {number}
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}