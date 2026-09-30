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
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Europe/Madrid",
    },
  ).format(
    new Date(value),
  );
}

export default async function MatchAdminDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } =
    await params;

  let match;
  let teams;

  try {
    [match, teams] =
      await Promise.all([
        getMatchById(id),
        getTeams(),
      ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <Link
              href="/match-admin"
              className="text-sm font-bold text-white/70"
            >
              ← Partidos
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Regional Fantasy
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Match Admin
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-red-50 p-5">
            <p className="font-black text-red-700">
              No se pudo cargar el partido.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!match) {
    notFound();
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
    match.home_score !== null &&
    match.away_score !== null;

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/match-admin"
            className="text-sm font-bold text-white/70"
          >
            ← Partidos
          </Link>

          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                Regional Fantasy
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Match Admin
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Centro de control del partido
              </p>
            </div>

            <span
              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ring-1 ${
                statusClasses[
                  match.status
                ] ??
                "bg-white/10 text-white ring-white/10"
              }`}
            >
              {statusLabels[
                match.status
              ] ??
                match.status}
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* PARTIDO */}
        <section className="mt-5 overflow-hidden rounded-[1.6rem] bg-white shadow-sm ring-1 ring-black/5">
          <div className="px-5 py-5">
            <p className="text-center text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
              Partido
            </p>

            <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
                  ⚽
                </div>

                <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                  {homeTeam}
                </p>
              </div>

              {hasResult ? (
                <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-center text-white">
                  <p className="whitespace-nowrap text-2xl font-black">
                    {match.home_score}
                    <span className="mx-2 text-zinc-500">
                      -
                    </span>
                    {match.away_score}
                  </p>
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-zinc-100 text-[10px] font-black text-zinc-400">
                  VS
                </div>
              )}

              <div className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
                  ⚽
                </div>

                <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                  {awayTeam}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-center">
            <p className="text-xs font-bold capitalize text-zinc-500">
              {formatMatchDate(
                match.match_date,
              )}
            </p>
          </div>
        </section>

        {/* GESTIÓN */}
        <section className="mt-8">
          <div className="px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Gestión
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
              Partido
            </h2>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <ActionCard
              href={`/admin/matches/${match.id}`}
              icon="👥"
              eyebrow="Plantilla"
              title="Convocatoria"
              description="Jugadores y participación"
            />

            <ActionCard
              href={`/match-admin/${match.id}/stats`}
              icon="📊"
              eyebrow="Partido"
              title="Estadísticas"
              description="Minutos, goles y tarjetas"
            />

            <ActionCard
              href={`/match-admin/${match.id}/vote`}
              icon="★"
              eyebrow="Valoración"
              title="Votaciones"
              description="Puntuar del 1 al 10"
              highlight={
                match.status ===
                "voting"
              }
            />

            <ActionCard
              href={`/match-admin/${match.id}/results`}
              icon="🏆"
              eyebrow="Resumen"
              title="Resultados"
              description="Notas finales y MVP"
            />
          </div>
        </section>

        {/* ESTADO RÁPIDO */}
        <section className="mt-7 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#0f3d2e] text-lg text-white">
              {match.status ===
              "voting"
                ? "★"
                : match.status ===
                    "closed"
                  ? "✓"
                  : "⚽"}
            </div>

            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
                Estado actual
              </p>

              <p className="mt-1 font-black text-[#0b2f23]">
                {statusLabels[
                  match.status
                ] ??
                  match.status}
              </p>

              <p className="mt-1 text-xs leading-5 text-[#557368]">
                {getStatusDescription(
                  match.status,
                )}
              </p>
            </div>
          </div>
        </section>

        {/* EDITAR */}
        <section className="mt-7">
          <Link
            href={`/admin/matches/${match.id}/edit`}
            className="flex min-h-14 w-full items-center justify-between rounded-[1.3rem] bg-white px-5 shadow-sm ring-1 ring-black/5"
          >
            <div>
              <p className="font-black text-zinc-950">
                Editar partido
              </p>

              <p className="mt-1 text-xs text-zinc-500">
                Fecha, equipos, resultado y estado
              </p>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 font-black text-zinc-500">
              →
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}

function ActionCard({
  href,
  icon,
  eyebrow,
  title,
  description,
  highlight = false,
}: {
  href: string;
  icon: string;
  eyebrow: string;
  title: string;
  description: string;
  highlight?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-44 flex-col justify-between rounded-[1.5rem] p-4 shadow-sm ring-1 transition active:scale-[0.98] ${
        highlight
          ? "bg-[#0f3d2e] text-white ring-[#0f3d2e]"
          : "bg-white text-zinc-950 ring-black/5"
      }`}
    >
      <div>
        <div
          className={`flex h-11 w-11 items-center justify-center rounded-2xl text-lg ${
            highlight
              ? "bg-white/10"
              : "bg-[#e8f2ed]"
          }`}
        >
          {icon}
        </div>

        <p
          className={`mt-4 text-[9px] font-black uppercase tracking-[0.16em] ${
            highlight
              ? "text-white/45"
              : "text-zinc-400"
          }`}
        >
          {eyebrow}
        </p>

        <h3 className="mt-1 text-lg font-black">
          {title}
        </h3>

        <p
          className={`mt-1 text-xs leading-5 ${
            highlight
              ? "text-white/60"
              : "text-zinc-500"
          }`}
        >
          {description}
        </p>
      </div>

      <span
        className={`mt-4 flex h-8 w-8 items-center justify-center self-end rounded-full font-black ${
          highlight
            ? "bg-white text-[#0f3d2e]"
            : "bg-zinc-950 text-white"
        }`}
      >
        →
      </span>
    </Link>
  );
}

function getStatusDescription(
  status: string,
): string {
  switch (status) {
    case "scheduled":
      return "El partido está preparado para gestionar convocatoria y estadísticas.";

    case "voting":
      return "La votación está abierta. Los usuarios autorizados pueden valorar a los jugadores.";

    case "finished":
      return "El partido ha finalizado. Revisa estadísticas y resultados antes del cierre.";

    case "closed":
      return "El partido está cerrado y las valoraciones finales ya están disponibles.";

    default:
      return "Gestiona los datos y el estado del partido.";
  }
}