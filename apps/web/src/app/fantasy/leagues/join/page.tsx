import Link from "next/link";

import { requireUser } from "@/lib/auth";

import JoinLeagueForm from "./join-league-form";

export default async function JoinFantasyLeaguePage() {
  await requireUser();

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
            Unirme a una liga
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
            Introduce el código de invitación que te ha enviado el creador de la liga.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        <section className="mt-5 rounded-[1.5rem] bg-[#e8f2ed] p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f3d2e] text-lg font-black text-white">
              #
            </div>

            <div>
              <p className="font-black text-[#0b2f23]">
                Necesitas un código
              </p>

              <p className="mt-1 text-xs leading-5 text-[#557368]">
                El código identifica la liga y te permitirá entrar directamente en ella.
              </p>
            </div>
          </div>
        </section>

        <JoinLeagueForm />

        <section className="mt-5 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
            ¿No tienes código?
          </p>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            Pídeselo al creador de la liga o crea una nueva desde Mis ligas.
          </p>

          <Link
            href="/fantasy/leagues/create"
            className="mt-4 inline-flex items-center text-sm font-black text-[#0f3d2e]"
          >
            Crear una liga →
          </Link>
        </section>
      </div>
    </main>
  );
}