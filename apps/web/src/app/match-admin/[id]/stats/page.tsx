import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById } from "@/data/matches";
import { getMatchPlayers } from "@/data/match-players";
import StatsForm from "./stats-form";

export default async function MatchStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let match;
  let players;

  try {
    [match, players] = await Promise.all([
      getMatchById(id),
      getMatchPlayers(id),
    ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 p-4">
        <h1 className="text-2xl font-bold">
          Estadísticas
        </h1>

        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          No se pudieron cargar los datos del partido.
        </p>

        <Link
          href={`/match-admin/${id}`}
          className="mt-6 inline-block text-sm font-medium underline"
        >
          ← Volver al partido
        </Link>
      </main>
    );
  }

  if (!match) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-6">
      <header>
        <Link
          href={`/match-admin/${id}`}
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver al partido
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Match Admin
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Estadísticas
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Introduce los datos de cada jugador.
        </p>
      </header>

      {players.length === 0 ? (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <p className="font-semibold text-zinc-950">
            No hay jugadores en la convocatoria.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Añade primero los jugadores desde la convocatoria.
          </p>

          <Link
            href={`/admin/matches/${id}`}
            className="mt-5 flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 font-semibold text-white"
          >
            Gestionar convocatoria
          </Link>
        </section>
      ) : (
        <section className="mt-6 space-y-5">
          {players.map((entry) => {
            const playerName = entry.player
              ? `${entry.player.first_name} ${
                  entry.player.last_name ?? ""
                }`.trim()
              : "Jugador no disponible";

            return (
              <article
                key={entry.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      {entry.player?.shirt_number !== null &&
                        entry.player?.shirt_number !== undefined && (
                          <span className="flex h-9 min-w-9 items-center justify-center rounded-lg bg-zinc-950 px-2 text-sm font-bold text-white">
                            {entry.player.shirt_number}
                          </span>
                        )}

                      <div>
                        <h2 className="text-lg font-bold text-zinc-950">
                          {playerName}
                        </h2>

                        <p className="text-sm text-zinc-500">
                          {entry.player?.position ?? "Sin posición"}
                          {entry.team?.name
                            ? ` · ${entry.team.name}`
                            : ""}
                        </p>
                      </div>
                    </div>
                  </div>

                  {entry.starter && (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800">
                      Titular
                    </span>
                  )}
                </div>

                <StatsForm
                  matchId={id}
                  entryId={entry.id}
                  starter={entry.starter}
                  minutesPlayed={entry.minutes_played}
                  goals={entry.goals}
                  assists={entry.assists}
                  yellowCards={entry.yellow_cards}
                  redCards={entry.red_cards}
                  cleanSheet={entry.clean_sheet}
                />
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}