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

import ShareLeagueButton from "./share-league-button";

export default async function FantasyLeagueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const league = await getFantasyLeagueById(id);

  if (!league) {
    notFound();
  }

  const [members, standings, matchdays] =
    await Promise.all([
      getFantasyLeagueMembers(id),
      getFantasyLeagueStandings(id),
      getUserFantasyMatchdays({
        leagueId: id,
        userId: user.id,
      }),
    ]);

  const currentMembership = members.find(
    (member) => member.user_id === user.id,
  );

  if (!currentMembership) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <Link
          href="/fantasy/leagues"
          className="text-sm font-bold text-[#0f3d2e]"
        >
          ← Mis ligas
        </Link>

        <section className="mt-6 rounded-[1.5rem] bg-red-50 p-5 text-red-700">
          <h1 className="text-xl font-black">
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
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-5 text-white">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/fantasy/leagues"
            className="inline-flex items-center text-sm font-bold text-white/70"
          >
            ← Mis ligas
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
            Fantasy Regional
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {league.name}
          </h1>

          <div className="mt-2 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />

            <p className="text-sm font-medium text-white/70">
              {league.team?.name ?? "Equipo no disponible"}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* ACCIÓN PRINCIPAL */}
        <section className="relative z-10 -mt-1 pt-5">
          <Link
            href={`/fantasy/leagues/${league.id}/lineup`}
            className="group block rounded-[1.6rem] bg-zinc-950 p-5 text-white shadow-lg"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#173f32] text-2xl">
                  ⚽
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                    Próximo partido
                  </p>

                  <p className="mt-1 text-xl font-black">
                    Preparar mi XI
                  </p>

                  <p className="mt-1 text-xs text-zinc-400">
                    Elige tus 11 jugadores
                  </p>
                </div>
              </div>

              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white font-black text-zinc-950 transition group-hover:translate-x-1">
                →
              </span>
            </div>
          </Link>
        </section>

        {/* RESUMEN */}
        <section className="mt-4 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-2xl font-black text-zinc-950">
              {members.length}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              Jugadores
            </p>
          </div>

          <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-2xl font-black text-zinc-950">
              {matchdays.length}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              Jornadas
            </p>
          </div>

          <div className="rounded-2xl bg-white px-3 py-4 text-center shadow-sm ring-1 ring-black/5">
            <p className="text-2xl font-black text-[#0f3d2e]">
              {getMyPosition(standings, user.id)}
            </p>

            <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-zinc-400">
              Posición
            </p>
          </div>
        </section>

        {/* CLASIFICACIÓN */}
        <section className="mt-8">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Liga
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Clasificación
              </h2>
            </div>

            <span className="text-xs font-semibold text-zinc-400">
              {standings.length} jugadores
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
            {/* CABECERA TABLA */}
            <div className="grid grid-cols-[42px_1fr_55px_55px] items-center border-b border-zinc-100 bg-zinc-50 px-4 py-3">
              <span className="text-[10px] font-black uppercase text-zinc-400">
                Pos
              </span>

              <span className="text-[10px] font-black uppercase text-zinc-400">
                Jugador
              </span>

              <span className="text-center text-[10px] font-black uppercase text-zinc-400">
                PJ
              </span>

              <span className="text-right text-[10px] font-black uppercase text-zinc-400">
                Pts
              </span>
            </div>

            {standings.map((standing, index) => {
              const isCurrentUser =
                standing.user_id === user.id;

              return (
                <div
                  key={standing.user_id}
                  className={`grid grid-cols-[42px_1fr_55px_55px] items-center border-b border-zinc-100 px-4 py-4 last:border-b-0 ${
                    isCurrentUser
                      ? "bg-[#edf5f1]"
                      : "bg-white"
                  }`}
                >
                  <div>
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-black ${
                        index === 0
                          ? "bg-[#0f3d2e] text-white"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-black text-zinc-950">
                        {standing.display_name}
                      </p>

                      {isCurrentUser && (
                        <span className="rounded-full bg-[#0f3d2e] px-2 py-0.5 text-[8px] font-black uppercase text-white">
                          Tú
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-center text-sm font-semibold text-zinc-500">
                    {standing.played_matches}
                  </p>

                  <p className="text-right text-base font-black text-zinc-950">
                    {standing.total_points}
                  </p>
                </div>
              );
            })}
          </div>
        </section>

        {/* JORNADAS */}
        <section className="mt-9">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Partidos
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Jornadas
              </h2>
            </div>

            <span className="text-xs font-semibold text-zinc-400">
              {matchdays.length}
            </span>
          </div>

          {matchdays.length === 0 ? (
            <div className="mt-4 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ed]">
                ⚽
              </div>

              <p className="mt-4 font-black text-zinc-950">
                Todavía no tienes jornadas
              </p>

              <p className="mt-1 text-sm leading-6 text-zinc-500">
                Cuando guardes un XI para un partido aparecerá aquí.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {matchdays.map((matchday) => {
                const hasScore =
                  matchday.home_score !== null &&
                  matchday.away_score !== null;

                const date =
                  new Intl.DateTimeFormat("es-ES", {
                    dateStyle: "medium",
                    timeStyle: "short",
                    timeZone: "Europe/Madrid",
                  }).format(
                    new Date(matchday.match_date),
                  );

                return (
                  <div
                    key={matchday.match_id}
                    className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5"
                  >
                    <div className="p-5">
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                        {date}
                      </p>

                      <div className="mt-4 grid grid-cols-[1fr_auto] items-center gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-4">
                            <p className="truncate text-sm font-black text-zinc-950">
                              {matchday.home_team_name}
                            </p>

                            {hasScore && (
                              <span className="text-xl font-black text-zinc-950">
                                {matchday.home_score}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-4">
                            <p className="truncate text-sm font-black text-zinc-950">
                              {matchday.away_team_name}
                            </p>

                            {hasScore && (
                              <span className="text-xl font-black text-zinc-950">
                                {matchday.away_score}
                              </span>
                            )}
                          </div>
                        </div>

                        {!hasScore && (
                          <span className="rounded-lg bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-400">
                            VS
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-100 bg-zinc-50/70 px-5 py-4">
                      {matchday.points_status === "ready" ? (
                        <>
                          <div>
                            <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
                              Tus puntos
                            </p>

                            <p className="mt-0.5 text-2xl font-black text-[#0f3d2e]">
                              {matchday.total_points}
                              <span className="ml-1 text-xs text-zinc-400">
                                pts
                              </span>
                            </p>
                          </div>

                          <Link
                            href={`/fantasy/leagues/${league.id}/matches/${matchday.match_id}`}
                            className="rounded-xl bg-zinc-950 px-4 py-3 text-xs font-black text-white"
                          >
                            Ver puntos →
                          </Link>
                        </>
                      ) : (
                        <>
                          <div>
                            <p className="text-sm font-black text-zinc-700">
                              Puntos pendientes
                            </p>

                            <p className="mt-1 text-xs text-zinc-400">
                              Esperando cierre del partido
                            </p>
                          </div>

                          <span className="rounded-full bg-zinc-200/70 px-3 py-1.5 text-[10px] font-black uppercase text-zinc-500">
                            Pendiente
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* INVITACIÓN */}
        <section className="mt-9">
          <p className="px-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Invitar
          </p>

          <div className="mt-2 flex items-center justify-between rounded-[1.4rem] bg-[#e8f2ed] p-5">
            <div>
              <p className="text-xs font-bold text-[#557368]">
                Código de liga
              </p>

              <p className="mt-1 text-2xl font-black tracking-[0.18em] text-[#0b2f23]">
                {league.code}
              </p>
            </div>

            <ShareLeagueButton
  leagueName={
    league.name
  }
  code={
    league.code
  }
/>
          </div>
        </section>

        {/* PARTICIPANTES */}
        <section className="mt-9">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-lg font-black text-zinc-950">
              Participantes
            </h2>

            <span className="text-xs font-semibold text-zinc-400">
              {members.length}
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">
            {members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 last:border-b-0"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] text-sm font-black text-[#0f3d2e]">
                    {getInitials(
                      member.profile?.display_name ??
                        "Usuario",
                    )}
                  </div>

                  <p className="truncate text-sm font-bold text-zinc-950">
                    {member.profile?.display_name ??
                      "Usuario"}
                  </p>
                </div>

                {member.user_id ===
                  league.created_by && (
                  <span className="ml-3 rounded-full bg-zinc-100 px-3 py-1 text-[9px] font-black uppercase text-zinc-500">
                    Creador
                  </span>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

function getMyPosition(
  standings: Array<{
    user_id: string;
  }>,
  userId: string,
): string {
  const index = standings.findIndex(
    (standing) =>
      standing.user_id === userId,
  );

  if (index === -1) {
    return "-";
  }

  return `${index + 1}º`;
}

function getInitials(
  name: string,
): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) =>
      part.charAt(0).toUpperCase(),
    )
    .join("");
}