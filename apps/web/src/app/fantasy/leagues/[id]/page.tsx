import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";

import {
  getFantasyLeagueById,
  getFantasyLeagueMembers,
} from "@/data/fantasy-leagues";

import {
  getFantasyLeagueStandings,
} from "@/data/fantasy-standings";

import {
  getUserFantasyMatchdays,
} from "@/data/fantasy-matchdays";

export default async function FantasyLeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const league =
    await getFantasyLeagueById(id);

  if (!league) {
    notFound();
  }

  const [
    members,
    standings,
    matchdays,
  ] = await Promise.all([
    getFantasyLeagueMembers(id),
    getFantasyLeagueStandings(id),
    getUserFantasyMatchdays({
      leagueId: id,
      userId: user.id,
    }),
  ]);

  const currentMembership =
    members.find(
      (member) =>
        member.user_id === user.id,
    );

  if (!currentMembership) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
        <Link
          href="/fantasy/leagues"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a mis ligas
        </Link>

        <section className="mt-6 rounded-2xl bg-red-50 p-5 text-red-700">
          <h1 className="text-xl font-bold">
            No tienes acceso a esta liga
          </h1>

          <p className="mt-2 text-sm">
            Debes ser miembro de la liga para ver su contenido.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
      <header>
        <Link
          href="/fantasy/leagues"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a mis ligas
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          {league.name}
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          {league.team?.name ??
            "Equipo no disponible"}
        </p>
      </header>

      <section className="mt-6 rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
        <p className="text-sm uppercase tracking-wide text-zinc-300">
          Código de invitación
        </p>

        <p className="mt-2 text-3xl font-black tracking-widest">
          {league.code}
        </p>

        <p className="mt-2 text-sm text-zinc-300">
          Comparte este código con los demás participantes.
        </p>
      </section>

      <section className="mt-8">
        <Link
          href={`/fantasy/leagues/${league.id}/lineup`}
          className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-zinc-950 px-5 font-semibold text-white"
        >
          <div>
            <p className="font-bold">
              Preparar Mi XI
            </p>

            <p className="mt-1 text-sm font-normal text-zinc-300">
              Elige tus 11 jugadores para el próximo partido
            </p>
          </div>

          <span className="text-xl">
            →
          </span>
        </Link>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-950">
            Jornadas
          </h2>

          <span className="text-sm text-zinc-500">
            {matchdays.length}
          </span>
        </div>

        {matchdays.length === 0 ? (
          <div className="mt-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
            <p className="font-semibold text-zinc-950">
              Todavía no tienes jornadas
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              Cuando guardes un XI para un partido aparecerá aquí.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {matchdays.map(
              (matchday) => {
                const hasScore =
                  matchday.home_score !== null &&
                  matchday.away_score !== null;

                const date =
                  new Intl.DateTimeFormat(
                    "es-ES",
                    {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "Europe/Madrid",
                    },
                  ).format(
                    new Date(
                      matchday.match_date,
                    ),
                  );

                return (
                  <div
                    key={matchday.match_id}
                    className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                          {date}
                        </p>

                        <div className="mt-2">
                          <p className="font-bold text-zinc-950">
                            {matchday.home_team_name}
                          </p>

                          <p className="font-bold text-zinc-950">
                            {matchday.away_team_name}
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        {hasScore ? (
                          <p className="text-2xl font-black text-zinc-950">
                            {matchday.home_score}
                            {" - "}
                            {matchday.away_score}
                          </p>
                        ) : (
                          <p className="font-bold text-zinc-400">
                            VS
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                      {matchday.points_status === "ready" ? (
                        <>
                          <div>
                            <p className="text-xs uppercase text-zinc-400">
                              Tus puntos
                            </p>

                            <p className="text-2xl font-black text-zinc-950">
                              {matchday.total_points}{" "}
                              <span className="text-sm font-semibold text-zinc-500">
                                pts
                              </span>
                            </p>
                          </div>

                          <Link
                            href={`/fantasy/leagues/${league.id}/matches/${matchday.match_id}`}
                            className="rounded-xl bg-zinc-950 px-4 py-3 text-sm font-bold text-white"
                          >
                            Ver puntos →
                          </Link>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="font-semibold text-zinc-700">
                              Puntos pendientes
                            </p>

                            <p className="mt-1 text-xs text-zinc-500">
                              Se calcularán al cerrar el partido.
                            </p>
                          </div>

                          <span className="rounded-xl bg-zinc-100 px-4 py-2 text-xs font-semibold text-zinc-500">
                            Pendiente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              },
            )}
          </div>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-zinc-950">
            Clasificación
          </h2>

          <span className="text-sm text-zinc-500">
            {standings.length} jugadores
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
          {standings.map(
            (standing, index) => (
              <div
                key={standing.user_id}
                className="flex items-center justify-between border-b border-zinc-100 px-5 py-4 last:border-b-0"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 font-black text-zinc-700">
                    {index + 1}
                  </span>

                  <div>
                    <p className="font-semibold text-zinc-950">
                      {standing.display_name}
                    </p>

                    <p className="mt-1 text-xs text-zinc-500">
                      {standing.played_matches}{" "}
                      {standing.played_matches === 1
                        ? "partido puntuado"
                        : "partidos puntuados"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-xl font-black text-zinc-950">
                    {standing.total_points}
                  </p>

                  <p className="text-xs text-zinc-400">
                    pts
                  </p>
                </div>
              </div>
            ),
          )}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-zinc-950">
            Participantes
          </h2>

          <span className="text-sm text-zinc-500">
            {members.length}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          {members.map(
            (member, index) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-200"
              >
                <div>
                  <p className="font-semibold text-zinc-950">
                    {member.profile?.display_name ??
                      "Usuario"}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    Participante {index + 1}
                  </p>
                </div>

                {member.user_id ===
                  league.created_by && (
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-700">
                    Creador
                  </span>
                )}
              </div>
            ),
          )}
        </div>
      </section>
    </main>
  );
}