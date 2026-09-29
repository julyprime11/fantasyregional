import Link from "next/link";
import { notFound } from "next/navigation";
import { getMatchById } from "@/data/matches";
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
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(value));
}

export default async function MatchAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let match;
  let teams;

  try {
    [match, teams] = await Promise.all([
      getMatchById(id),
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
          No se pudo cargar el partido.
        </p>

        <Link
          href="/match-admin"
          className="mt-6 inline-block text-sm font-medium underline"
        >
          Volver
        </Link>
      </main>
    );
  }

  if (!match) {
    notFound();
  }

  const teamNames = new Map(
    teams.map((team) => [team.id, team.name]),
  );

  const homeTeam =
    teamNames.get(match.home_team_id) ?? "Equipo local";

  const awayTeam =
    teamNames.get(match.away_team_id) ?? "Equipo visitante";

  const hasResult =
    match.home_score !== null &&
    match.away_score !== null;

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-6">
      <header className="mb-6">
        <Link
          href="/match-admin"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a partidos
        </Link>

        <div className="mt-5 flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Regional Fantasy
            </p>

            <h1 className="mt-1 text-3xl font-bold text-zinc-950">
              Match Admin
            </h1>
          </div>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              statusClasses[match.status] ??
              "bg-zinc-100 text-zinc-700"
            }`}
          >
            {statusLabels[match.status] ?? match.status}
          </span>
        </div>
      </header>

      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <p className="text-center text-sm text-zinc-500">
          {formatMatchDate(match.match_date)}
        </p>

        <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <div className="text-left">
            <p className="font-semibold text-zinc-950">
              {homeTeam}
            </p>
          </div>

          <div className="text-center">
            {hasResult ? (
              <p className="text-3xl font-bold text-zinc-950">
                {match.home_score} - {match.away_score}
              </p>
            ) : (
              <p className="text-xl font-bold text-zinc-400">
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
      </section>

      <section className="mt-6 space-y-3">
        <h2 className="text-lg font-bold text-zinc-950">
          Gestión rápida
        </h2>

        <Link
          href={`/admin/matches/${match.id}`}
          className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-5 shadow-sm ring-1 ring-zinc-200"
        >
          <div>
            <p className="font-semibold text-zinc-950">
              Convocatoria
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Añadir jugadores y revisar participación
            </p>
          </div>

          <span className="text-xl text-zinc-400">
            →
          </span>
        </Link>

        <Link
          href={`/match-admin/${match.id}/stats`}
          className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-5 shadow-sm ring-1 ring-zinc-200"
        >
          <div>
            <p className="font-semibold text-zinc-950">
              Estadísticas
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Minutos, goles, asistencias y tarjetas
            </p>
          </div>

          <span className="text-xl text-zinc-400">
            →
          </span>
        </Link>

        <Link
          href={`/match-admin/${match.id}/vote`}
          className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-5 shadow-sm ring-1 ring-zinc-200"
        >
          <div>
            <p className="font-semibold text-zinc-950">
              Votar jugadores
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Puntuar jugadores del 1 al 10
            </p>
          </div>

          <span className="text-xl text-zinc-400">
            →
          </span>
        </Link>

        <Link
          href={`/match-admin/${match.id}/results`}
          className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-5 shadow-sm ring-1 ring-zinc-200"
        >
          <div>
            <p className="font-semibold text-zinc-950">
              Resultados / MVP
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              Ver notas y mejor jugador
            </p>
          </div>

          <span className="text-xl text-zinc-400">
            →
          </span>
        </Link>
      </section>

      <section className="mt-8">
        <Link
          href={`/admin/matches/${match.id}/edit`}
          className="flex min-h-12 w-full items-center justify-center rounded-xl border border-zinc-300 bg-white px-4 text-sm font-semibold text-zinc-800"
        >
          Editar datos básicos del partido
        </Link>
      </section>
    </main>
  );
}