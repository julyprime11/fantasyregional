import Link from "next/link";
import { notFound } from "next/navigation";

import { parseMatchId } from "@regional-fantasy/shared";

import { requireUser } from "@/lib/auth";
import { canViewFinalMatchResults } from "@/lib/roles";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMatchById } from "@/data/matches";
import { getMatchResults } from "@/data/match-results";
import { getTeams } from "@/data/teams";

const formatRating = (value: number | null): string =>
  value === null ? "—" : value.toFixed(2);

export default async function FinalMatchResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const supabase = await createServerSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("voter_role")
    .eq("id", user.id)
    .maybeSingle();

  // La autorización se valida en el servidor, aunque se acceda por URL.
  if (
    profileError ||
    !canViewFinalMatchResults(profile?.voter_role)
  ) {
    notFound();
  }

  const { id } = await params;
  let matchId: string;
  try {
    matchId = parseMatchId(id);
  } catch {
    notFound();
  }

  let match;
  try {
    match = await getMatchById(matchId);
  } catch {
    return <ErrorMessage />;
  }

  // La votación puede seguir abierta después del pitido final.
  // Las notas solo se publican cuando se cierra el partido.
  if (!match || match.status !== "closed") {
    notFound();
  }

  let results;
  let teams;
  try {
    [results, teams] = await Promise.all([
      getMatchResults(matchId),
      getTeams(),
    ]);
  } catch {
    return <ErrorMessage />;
  }

  if (results.status !== "ready" || results.phase !== "final") {
    return <ErrorMessage />;
  }

  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const homeTeam = teamNames.get(match.home_team_id) ?? "Equipo local";
  const awayTeam = teamNames.get(match.away_team_id) ?? "Equipo visitante";

  const players = [...results.rows].sort((a, b) => {
    const aRating = a.rating.final_rating ?? -1;
    const bRating = b.rating.final_rating ?? -1;
    return bRating - aRating;
  });

  const playerName = (entry: (typeof results.rows)[number]["entry"]) =>
    entry.player
      ? [entry.player.first_name, entry.player.last_name]
          .filter(Boolean)
          .join(" ")
      : "Jugador";

  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
      <header className="rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
        <Link
          href="/matches"
          className="inline-flex min-h-10 items-center text-xs font-bold text-white/75"
        >
          ← Partidos
        </Link>
        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.18em] text-white/60">
          Valoraciones
        </p>
        <h1 className="mt-1 text-2xl font-black tracking-tight">
          Resultados finales
        </h1>
        <p className="mt-1 text-xs text-white/65">
          Notas definitivas tras el cierre de la votación
        </p>
      </header>

      <div className="space-y-4 px-4 pb-10 pt-4">
        <section className="rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <p className="text-right text-sm font-black leading-5 text-zinc-950">
              {homeTeam}
            </p>
            <div className="rounded-xl bg-zinc-950 px-3 py-2 text-sm font-black tabular-nums text-white">
              {match.home_score ?? "—"} - {match.away_score ?? "—"}
            </div>
            <p className="text-left text-sm font-black leading-5 text-zinc-950">
              {awayTeam}
            </p>
          </div>
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-wide text-emerald-700">
            Partido cerrado · Votaciones finalizadas
          </p>
        </section>

        <section className="rounded-[1.3rem] bg-zinc-950 p-4 text-white shadow-sm">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/50">
            Jugador del partido
          </p>
          <h2 className="mt-1 text-lg font-black">★ MVP</h2>

          {results.mvp.status === "none" ? (
            <p className="mt-3 text-sm text-white/65">
              No hay jugadores con una valoración válida.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {results.mvp.status === "shared" && (
                <p className="text-xs font-bold text-amber-300">
                  MVP compartido
                </p>
              )}
              {results.mvp.players.map((mvp) => {
                const player = results.rows.find(
                  (row) => row.entry.player_id === mvp.player_id,
                );
                return (
                  <div
                    key={mvp.player_id}
                    className="flex items-center justify-between gap-3 rounded-xl bg-white/10 p-3"
                  >
                    <span className="min-w-0 text-sm font-black">
                      {player ? playerName(player.entry) : "Jugador"}
                    </span>
                    <span className="shrink-0 text-xl font-black tabular-nums">
                      {formatRating(mvp.final_rating)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section>
          <div className="px-1">
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Clasificación del partido
            </p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-950">
              Notas finales
            </h2>
            <p className="mt-1 text-xs text-zinc-500">
              Ordenadas por valoración, sin puntos Fantasy.
            </p>
          </div>

          {players.length === 0 ? (
            <p className="mt-3 rounded-xl bg-white p-4 text-sm text-zinc-500">
              No hay jugadores en la convocatoria.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {players.map(({ entry, rating }, index) => (
                <article
                  key={entry.id}
                  className="flex items-center gap-3 rounded-[1.1rem] bg-white p-3 shadow-sm ring-1 ring-black/5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] text-sm font-black text-[#0f3d2e]">
                    {entry.player?.shirt_number ?? "—"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-zinc-950">
                      {playerName(entry)}
                    </p>
                    <p className="mt-0.5 text-[10px] text-zinc-500">
                      {entry.team?.name ?? "Equipo"} · {rating.vote_count} votos
                    </p>
                    {rating.status !== "rated" && (
                      <p className="mt-0.5 text-[10px] text-amber-700">
                        {rating.status === "no_minutes"
                          ? "Sin minutos disputados"
                          : rating.status === "insufficient_votes"
                            ? "Sin votos suficientes"
                            : "Valoración no disponible"}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black tabular-nums text-[#0f3d2e]">
                      {formatRating(rating.final_rating)}
                    </p>
                    <p className="text-[9px] text-zinc-400">
                      {rating.status === "rated" ? `#${index + 1}` : "Sin nota"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ErrorMessage() {
  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2] px-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
      <Link href="/matches" className="text-sm font-bold text-[#0f3d2e]">
        ← Partidos
      </Link>
      <p role="alert" className="mt-5 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-700">
        No se pudieron cargar los resultados finales. Inténtalo de nuevo.
      </p>
    </main>
  );
}
