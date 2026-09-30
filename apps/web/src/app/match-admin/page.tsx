import Link from "next/link";

import { getMatches } from "@/data/matches";
import { getTeams } from "@/data/teams";

const statusLabels: Record<
  string,
  string
> = {
  scheduled: "Programado",
  finished: "Finalizado",
  voting: "Votación abierta",
  closed: "Cerrado",
};

const statusClasses: Record<
  string,
  string
> = {
  scheduled:
    "bg-blue-50 text-blue-700 ring-blue-100",

  finished:
    "bg-zinc-100 text-zinc-600 ring-zinc-200",

  voting:
    "bg-amber-50 text-amber-700 ring-amber-100",

  closed:
    "bg-[#e8f2ed] text-[#0f3d2e] ring-[#d7e8df]",
};

function formatMatchDate(
  value: string,
): string {
  return new Intl.DateTimeFormat(
    "es-ES",
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone:
        "Europe/Madrid",
    },
  ).format(
    new Date(value),
  );
}

export default async function MatchAdminPage() {
  let matches;
  let teams;

  try {
    [matches, teams] =
      await Promise.all([
        getMatches(),
        getTeams(),
      ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-7 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Regional Fantasy
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Match Admin
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-red-50 p-5">
            <p className="font-black text-red-700">
              No se pudieron cargar los partidos.
            </p>

            <p className="mt-2 text-sm text-red-600">
              Inténtalo de nuevo dentro de unos instantes.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const teamNames =
    new Map(
      teams.map(
        (team) => [
          team.id,
          team.name,
        ],
      ),
    );

  const scheduledCount =
    matches.filter(
      (match) =>
        match.status ===
        "scheduled",
    ).length;

  const votingCount =
    matches.filter(
      (match) =>
        match.status ===
        "voting",
    ).length;

  const finishedCount =
    matches.filter(
      (match) =>
        match.status ===
          "finished" ||
        match.status ===
          "closed",
    ).length;

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-7 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/fantasy"
            className="text-sm font-bold text-white/70"
          >
            ← Fantasy
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
            Regional Fantasy
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Match Admin
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/70">
            Gestiona convocatoria, estadísticas, votación y resultados.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* RESUMEN */}
        <section className="mt-5 grid grid-cols-3 gap-2">
          <SummaryCard
            value={
              scheduledCount
            }
            label="Programados"
          />

          <SummaryCard
            value={
              votingCount
            }
            label="En votación"
            highlight
          />

          <SummaryCard
            value={
              finishedCount
            }
            label="Cerrados"
          />
        </section>

        {/* PARTIDOS */}
        <section className="mt-8">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Partidos
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Gestión
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
              {matches.length}
            </span>
          </div>

          {matches.length ===
          0 ? (
            <div className="mt-4 rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
                ⚽
              </div>

              <p className="mt-4 font-black text-zinc-950">
                No hay partidos disponibles
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Crea primero un partido desde el panel de administración.
              </p>

              <Link
                href="/admin/matches"
                className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[1.1rem] bg-zinc-950 px-4 text-sm font-black text-white"
              >
                Ir a administración →
              </Link>
            </div>
          ) : (
            <div className="mt-4 space-y-3">
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

                  const hasResult =
                    match.home_score !==
                      null &&
                    match.away_score !==
                      null;

                  return (
                    <article
                      key={
                        match.id
                      }
                      className="overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5"
                    >
                      {/* TOP */}
                      <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
                        <p className="text-xs font-bold capitalize text-zinc-400">
                          {formatMatchDate(
                            match.match_date,
                          )}
                        </p>

                        <span
                          className={`rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ring-1 ${
                            statusClasses[
                              match.status
                            ] ??
                            "bg-zinc-100 text-zinc-600 ring-zinc-200"
                          }`}
                        >
                          {statusLabels[
                            match.status
                          ] ??
                            match.status}
                        </span>
                      </div>

                      {/* MARCADOR */}
                      <div className="px-5 py-5">
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                          <div className="text-center">
                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg">
                              ⚽
                            </div>

                            <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                              {homeTeam}
                            </p>
                          </div>

                          {hasResult ? (
                            <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-center text-white">
                              <p className="whitespace-nowrap text-xl font-black">
                                {
                                  match.home_score
                                }
                                <span className="mx-2 text-zinc-500">
                                  -
                                </span>
                                {
                                  match.away_score
                                }
                              </p>
                            </div>
                          ) : (
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-[10px] font-black text-zinc-400">
                              VS
                            </div>
                          )}

                          <div className="text-center">
                            <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-zinc-100 text-lg">
                              ⚽
                            </div>

                            <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                              {awayTeam}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* ACCIÓN */}
                      <div className="border-t border-zinc-100 bg-zinc-50/70 p-3">
                        <Link
                          href={`/match-admin/${match.id}`}
                          className="flex min-h-12 w-full items-center justify-between rounded-[1rem] bg-zinc-950 px-4 text-white active:scale-[0.99]"
                        >
                          <div>
                            <p className="text-sm font-black">
                              Gestionar partido
                            </p>

                            <p className="mt-0.5 text-[10px] text-zinc-400">
                              Convocatoria · Stats · Votos · Resultado
                            </p>
                          </div>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-black text-zinc-950">
                            →
                          </span>
                        </Link>
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* ADMIN COMPLETO */}
        <section className="mt-8">
          <Link
            href="/admin"
            className="flex items-center justify-between rounded-[1.4rem] bg-[#e8f2ed] p-4"
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
                Administración
              </p>

              <p className="mt-1 font-black text-[#0b2f23]">
                Panel completo
              </p>

              <p className="mt-1 text-xs text-[#557368]">
                Clubes, equipos, jugadores y usuarios
              </p>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f3d2e] font-black text-white">
              →
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}

function SummaryCard({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.3rem] px-2 py-4 text-center shadow-sm ring-1 ${
        highlight
          ? "bg-[#e8f2ed] ring-[#d7e8df]"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-2xl font-black ${
          highlight
            ? "text-[#0f3d2e]"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[9px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}