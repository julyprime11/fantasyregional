import Link from "next/link";

import {
  getTeams,
} from "@/data/teams";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export default async function MatchesPage() {
  const supabase =
    await createServerSupabaseClient();

  const [
    teamsResult,
    matchesResult,
  ] =
    await Promise.all([
      getTeams(),

      supabase
        .from(
          "matches",
        )
        .select(
          `
            id,
            home_team_id,
            away_team_id,
            status,
            voting_opens_at,
            voting_closes_at
          `,
        )
        .eq(
          "status",
          "voting",
        ),
    ]);

  const teams =
    teamsResult;

  const matches =
    matchesResult.data ??
    [];

  const teamNames =
    new Map(
      teams.map(
        (team) => [
          team.id,
          team.name,
        ],
      ),
    );

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
            Fantasy Regional
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Votaciones
          </h1>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Selecciona un partido para valorar a los jugadores.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        {matchesResult.error ? (
          <section className="mt-4 rounded-[1.2rem] bg-red-50 p-4">
            <p className="font-black text-red-800">
              No se pudieron cargar los partidos.
            </p>

            <p className="mt-1 text-xs leading-5 text-red-600">
              Inténtalo de nuevo.
            </p>
          </section>
        ) : matches.length ===
          0 ? (
          <section className="mt-4 rounded-[1.2rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f2ed] text-xl">
              ⚽
            </div>

            <p className="mt-3 font-black text-zinc-950">
              No hay votaciones abiertas
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Cuando un partido entre en periodo de votación aparecerá aquí.
            </p>
          </section>
        ) : (
          <section className="mt-4 space-y-3">
            <div className="px-1">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                Partidos disponibles
              </p>
            </div>

            {matches.map(
              (match) => {
                const homeTeam =
                  teamNames.get(
                    match.home_team_id,
                  ) ??
                  "Equipo local";

                const awayTeam =
                  teamNames.get(
                    match.away_team_id,
                  ) ??
                  "Equipo visitante";

                return (
                  <Link
                    key={
                      match.id
                    }
                    href={`/matches/${match.id}/vote`}
                    className="block rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#0f3d2e]">
                          Votación abierta
                        </p>

                        <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                          <p className="text-right text-sm font-black leading-5 text-zinc-950">
                            {
                              homeTeam
                            }
                          </p>

                          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-950 text-[8px] font-black text-white">
                            VS
                          </span>

                          <p className="text-left text-sm font-black leading-5 text-zinc-950">
                            {
                              awayTeam
                            }
                          </p>
                        </div>
                      </div>

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] font-black text-[#0f3d2e]">
                        →
                      </span>
                    </div>
                  </Link>
                );
              },
            )}
          </section>
        )}
      </div>
    </main>
  );
}