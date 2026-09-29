import Link from "next/link";
import { getMatches } from "@/data/matches";
import { getTeams } from "@/data/teams";

const statusLabels: Record<string, string> = {
  scheduled: "Programado",
  finished: "Finalizado",
  voting: "Votación abierta",
  closed: "Cerrado",
};

const statusClasses: Record<string, string> = {
  scheduled: "bg-blue-100 text-blue-800",
  finished: "bg-zinc-200 text-zinc-800",
  voting: "bg-amber-100 text-amber-800",
  closed: "bg-green-100 text-green-800",
};

function formatMatchDate(value: string): string {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export default async function MatchAdminPage() {
  let matches;
  let teams;

  try {
    [matches, teams] = await Promise.all([
      getMatches(),
      getTeams(),
    ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 p-4">
        <h1 className="text-2xl font-bold">Match Admin</h1>

        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          No se pudieron cargar los partidos.
        </p>
      </main>
    );
  }

  const teamNames = new Map(
    teams.map((team) => [team.id, team.name]),
  );

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-6">
      <header className="mb-6">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Match Admin
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Gestión rápida de partidos desde el móvil.
        </p>
      </header>

      {matches.length === 0 ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="font-medium text-zinc-900">
            No hay partidos disponibles.
          </p>

          <p className="mt-1 text-sm text-zinc-500">
            Crea primero un partido desde el panel de administración.
          </p>

          <Link
            href="/admin/matches"
            className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 font-semibold text-white"
          >
            Ir a administración
          </Link>
        </div>
      ) : (
        <section className="space-y-4">
          {matches.map((match) => {
            const homeTeam =
              teamNames.get(match.home_team_id) ?? "Equipo local";

            const awayTeam =
              teamNames.get(match.away_team_id) ?? "Equipo visitante";

            const hasResult =
              match.home_score !== null &&
              match.away_score !== null;

            return (
              <article
                key={match.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm text-zinc-500">
                      {formatMatchDate(match.match_date)}
                    </p>

                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
                        statusClasses[match.status] ??
                        "bg-zinc-100 text-zinc-700"
                      }`}
                    >
                      {statusLabels[match.status] ?? match.status}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="text-left">
                      <p className="font-semibold text-zinc-950">
                        {homeTeam}
                      </p>
                    </div>

                    <div className="text-center">
                      {hasResult ? (
                        <p className="text-2xl font-bold text-zinc-950">
                          {match.home_score} - {match.away_score}
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-zinc-400">
                          VS
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-zinc-950">
                        {awayTeam}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="border-t border-zinc-100 p-3">
                  <Link
                    href={`/match-admin/${match.id}`}
                    className="flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-center font-semibold text-white active:scale-[0.99]"
                  >
                    Gestionar partido
                  </Link>
                </div>
              </article>
            );
          })}
        </section>
      )}

      <footer className="mt-8 border-t border-zinc-200 pt-5">
        <Link
          href="/admin"
          className="text-sm font-medium text-zinc-600 underline"
        >
          Administración completa
        </Link>
      </footer>
    </main>
  );
}