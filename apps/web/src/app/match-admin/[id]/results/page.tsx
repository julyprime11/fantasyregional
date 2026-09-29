import Link from "next/link";
import { notFound } from "next/navigation";
import { parseMatchId } from "@regional-fantasy/shared";
import { getMatchResults } from "@/data/match-results";

const display = (value: number | null): string =>
  value === null ? "—" : value.toFixed(2);

export default async function MatchAdminResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let matchId: string;

  try {
    matchId = parseMatchId(id);
  } catch {
    notFound();
  }

  let result;

  try {
    result = await getMatchResults(matchId);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 p-4">
        <h1 className="text-2xl font-bold">Resultados / MVP</h1>

        <p
          role="alert"
          className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          No se pudieron calcular los resultados.
        </p>

        <Link
          href={`/match-admin/${matchId}`}
          className="mt-6 inline-block text-sm font-medium underline"
        >
          ← Volver al partido
        </Link>
      </main>
    );
  }

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "not_ready") {
    const message =
      result.match.status === "finished"
        ? "La votación de este partido todavía no se ha abierto."
        : "Los resultados todavía no están disponibles.";

    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-6">
        <Link
          href={`/match-admin/${matchId}`}
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver al partido
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-zinc-950">
          Resultados / MVP
        </h1>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="font-semibold text-zinc-950">
            Resultados no disponibles
          </p>

          <p className="mt-2 text-sm text-zinc-600">
            {message}
          </p>
        </section>
      </main>
    );
  }

  const playerName = (
    entry: (typeof result.rows)[number]["entry"],
  ) =>
    entry.player
      ? `${entry.player.first_name} ${
          entry.player.last_name ?? ""
        }`.trim()
      : "Jugador no disponible";

  const provisional =
    result.phase === "provisional";

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
          {provisional
            ? "Resultados provisionales"
            : "Resultados finales"}
        </h1>

        {provisional && (
          <p className="mt-2 text-sm text-zinc-600">
            Las puntuaciones pueden cambiar mientras
            llegan nuevos votos.
          </p>
        )}
      </header>

      <section className="mt-6 rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-300">
          {provisional
            ? "MVP provisional"
            : "MVP"}
        </p>

        {result.mvp.status === "none" ? (
          <div className="mt-3">
            <p className="text-lg font-bold">
              Sin MVP disponible
            </p>

            <p className="mt-1 text-sm text-zinc-300">
              Todavía no hay jugadores con minutos y
              votos suficientes.
            </p>
          </div>
        ) : (
          <div className="mt-4">
            {result.mvp.status === "shared" && (
              <p className="mb-3 text-sm font-semibold text-amber-300">
                MVP compartido
              </p>
            )}

            <div className="space-y-3">
              {result.mvp.players.map((player) => {
                const row = result.rows.find(
                  (item) =>
                    item.entry.player_id ===
                    player.player_id,
                );

                return (
                  <div
                    key={player.player_id}
                    className="flex items-center justify-between gap-4 rounded-xl bg-white/10 p-4"
                  >
                    <div>
                      <p className="font-bold">
                        {row
                          ? playerName(row.entry)
                          : "Jugador no disponible"}
                      </p>

                      <p className="mt-1 text-sm text-zinc-300">
                        {row?.entry.player?.position ??
                          "Sin posición"}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black">
                        {display(
                          player.final_rating,
                        )}
                      </p>

                      <p className="text-xs text-zinc-300">
                        nota final
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="mt-6">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">
              Jugadores
            </h2>

            <p className="text-sm text-zinc-500">
              Mínimo de votos:{" "}
              {result.minimumVotes}
            </p>
          </div>

          <span className="text-sm font-medium text-zinc-500">
            {result.rows.length} jugadores
          </span>
        </div>

        {result.rows.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            No hay jugadores en la convocatoria.
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            {result.rows
              .slice()
              .sort((a, b) => {
                const aRating =
                  a.rating.final_rating ?? -1;
                const bRating =
                  b.rating.final_rating ?? -1;

                return bRating - aRating;
              })
              .map(({ entry, rating }) => (
                <article
                  key={entry.id}
                  className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {entry.player?.shirt_number !==
                        null &&
                        entry.player?.shirt_number !==
                          undefined && (
                          <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-zinc-950 px-2 font-bold text-white">
                            {
                              entry.player
                                .shirt_number
                            }
                          </span>
                        )}

                      <div>
                        <h3 className="font-bold text-zinc-950">
                          {playerName(entry)}
                        </h3>

                        <p className="mt-1 text-sm text-zinc-500">
                          {entry.player?.position ??
                            "Sin posición"}
                          {entry.team?.name
                            ? ` · ${entry.team.name}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-3xl font-black text-zinc-950">
                        {display(
                          rating.final_rating,
                        )}
                      </p>

                      <p className="text-xs text-zinc-500">
                        nota final
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <Stat
                      label="Panel"
                      value={display(
                        rating.panel_average,
                      )}
                    />

                    <Stat
                      label="Estadística"
                      value={display(
                        rating.statistical_score,
                      )}
                    />

                    <Stat
                      label="Votos"
                      value={String(
                        rating.vote_count,
                      )}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-2">
                    <SmallStat
                      label="Min."
                      value={entry.minutes_played}
                    />

                    <SmallStat
                      label="Goles"
                      value={entry.goals}
                    />

                    <SmallStat
                      label="Asist."
                      value={entry.assists}
                    />

                    <SmallStat
                      label="Tarj."
                      value={
                        entry.yellow_cards +
                        entry.red_cards
                      }
                    />
                  </div>

                  {rating.status !== "rated" && (
                    <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
                      {rating.reason}
                    </p>
                  )}
                </article>
              ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-zinc-100 p-3">
      <p className="text-lg font-bold text-zinc-950">
        {value}
      </p>

      <p className="mt-1 text-xs text-zinc-500">
        {label}
      </p>
    </div>
  );
}

function SmallStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-lg border border-zinc-200 p-2 text-center">
      <p className="font-bold text-zinc-950">
        {value}
      </p>

      <p className="text-xs text-zinc-500">
        {label}
      </p>
    </div>
  );
}