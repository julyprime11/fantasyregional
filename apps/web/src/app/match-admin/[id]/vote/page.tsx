import Link from "next/link";
import { notFound } from "next/navigation";
import { parseMatchId } from "@regional-fantasy/shared";
import { getMatchById } from "@/data/matches";
import { getMatchPlayers } from "@/data/match-players";
import { getTeams } from "@/data/teams";
import { isDevelopmentVotingEnabled } from "@/lib/development-voting";
import { submitVotesAction } from "@/app/matches/[id]/vote/actions";
import { MobileVoteForm } from "./vote-form";

export default async function MatchAdminVotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!isDevelopmentVotingEnabled()) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 p-4">
        <h1 className="text-2xl font-bold">
          Votación no disponible
        </h1>

        <p className="mt-4 text-zinc-600">
          La identidad temporal del votante
          solo está habilitada durante el
          desarrollo.
        </p>
      </main>
    );
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
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 p-4">
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-red-700"
        >
          No se pudo cargar el partido.
        </p>
      </main>
    );
  }

  if (!match) {
    notFound();
  }

  let teams;
  let squad;

  try {
    [teams, squad] = await Promise.all([
      getTeams(),
      match.status === "voting"
        ? getMatchPlayers(matchId)
        : Promise.resolve([]),
    ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 p-4">
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-red-700"
        >
          No se pudo cargar la convocatoria.
        </p>
      </main>
    );
  }

  const teamNames = new Map(
    teams.map((team) => [
      team.id,
      team.name,
    ]),
  );

  const homeTeam =
    teamNames.get(match.home_team_id) ??
    "Equipo local";

  const awayTeam =
    teamNames.get(match.away_team_id) ??
    "Equipo visitante";

  const hasResult =
    match.home_score !== null &&
    match.away_score !== null;

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-6">
      <header>
        <Link
          href={`/match-admin/${matchId}`}
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver al partido
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Match Admin
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Votación
        </h1>
      </header>

      <section className="mt-5 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className="font-semibold text-zinc-950">
            {homeTeam}
          </p>

          <div className="text-center">
            {hasResult ? (
              <p className="text-2xl font-bold text-zinc-950">
                {match.home_score} -{" "}
                {match.away_score}
              </p>
            ) : (
              <p className="font-bold text-zinc-400">
                VS
              </p>
            )}
          </div>

          <p className="text-right font-semibold text-zinc-950">
            {awayTeam}
          </p>
        </div>
      </section>

      {match.status !== "voting" ? (
        <section className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-900">
          <h2 className="font-bold">
            Votación cerrada
          </h2>

          <p className="mt-1 text-sm">
            El partido debe estar en estado
            «Votación abierta» para poder
            puntuar a los jugadores.
          </p>
        </section>
      ) : squad.length === 0 ? (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <p className="font-semibold">
            No hay jugadores disponibles para
            votar.
          </p>
        </section>
      ) : (
        <MobileVoteForm
          action={submitVotesAction.bind(
            null,
            match.id,
          )}
          players={squad.map((entry) => ({
            id: entry.player_id,
            name: entry.player
              ? `${entry.player.first_name} ${
                  entry.player.last_name ?? ""
                }`.trim()
              : "Jugador no disponible",
            shirtNumber:
              entry.player?.shirt_number ??
              null,
            position:
              entry.player?.position ??
              "Sin posición",
            team:
              entry.team?.name ??
              "Equipo no disponible",
          }))}
        />
      )}
    </main>
  );
}