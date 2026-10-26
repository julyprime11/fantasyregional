import Link from "next/link";

import {
  getTeams,
} from "@/data/teams";

import { requireUser } from "@/lib/auth";
import { canViewFinalMatchResults } from "@/lib/roles";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export default async function MatchesPage() {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("voter_role")
    .eq("id", user.id)
    .maybeSingle();

  const canSeeFinalResults = canViewFinalMatchResults(profile?.voter_role);

  const [
    teamsResult,
    matchesResult,
    closedMatchesResult,
  ] = await Promise.all([
    getTeams(),

    supabase
      .from("matches")
      .select(`
        id,
        home_team_id,
        away_team_id,
        status,
        voting_opens_at,
        voting_closes_at
      `)
      .eq("status", "voting"),

    canSeeFinalResults
      ? supabase
          .from("matches")
          .select("id, home_team_id, away_team_id, home_score, away_score, match_date")
          .eq("status", "closed")
          .order("match_date", { ascending: false })
          .limit(30)
      : Promise.resolve(null),
  ]);

  const teams =
    teamsResult;

  const matches =
    matchesResult.data ??
    [];

  const closedMatches = closedMatchesResult?.data ?? [];

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
            {canSeeFinalResults
              ? "Vota en los partidos abiertos y consulta las notas finales."
              : "Selecciona un partido para valorar a los jugadores."}
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

        {canSeeFinalResults && (
          <section className="mt-7">
            <div className="px-1">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0f3d2e]">
                Votaciones cerradas
              </p>
              <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">
                Resultados finales
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Consulta las notas definitivas y el MVP de los últimos partidos.
              </p>
            </div>

            {closedMatchesResult?.error ? (
              <p role="alert" className="mt-3 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
                No se pudieron cargar los resultados finales.
              </p>
            ) : closedMatches.length === 0 ? (
              <p className="mt-3 rounded-xl bg-white p-4 text-sm text-zinc-500 shadow-sm ring-1 ring-black/5">
                Todavía no hay partidos con las votaciones cerradas.
              </p>
            ) : (
              <div className="mt-3 space-y-3">
                {closedMatches.map((match) => (
                  <Link
                    key={match.id}
                    href={`/matches/${match.id}/results`}
                    className="block rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                  >
                    <p className="text-[9px] font-black uppercase tracking-[0.14em] text-[#0f3d2e]">
                      Ver resultados finales
                    </p>
                    <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <p className="text-right text-sm font-black leading-5 text-zinc-950">
                        {teamNames.get(match.home_team_id) ?? "Equipo local"}
                      </p>
                      <span className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-black tabular-nums text-white">
                        {match.home_score ?? "—"} - {match.away_score ?? "—"}
                      </span>
                      <p className="text-left text-sm font-black leading-5 text-zinc-950">
                        {teamNames.get(match.away_team_id) ?? "Equipo visitante"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}