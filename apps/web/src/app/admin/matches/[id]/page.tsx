import Link from "next/link";
import { notFound } from "next/navigation";

import {
  parseMatchId,
} from "@regional-fantasy/shared";

import { getMatchById } from "@/data/matches";
import { getTeams } from "@/data/teams";
import { getCompetitions } from "@/data/competitions";

import {
  getMatchPlayers,
  getEligibleSquadPlayers,
} from "@/data/match-players";

import {
  addMatchPlayerAction,
  removeMatchPlayerAction,
} from "../../actions";

import { CreateForm } from "../../create-form";

import {
  matchStatusLabels,
} from "../fields";

import {
  isDevelopmentVotingEnabled,
} from "@/lib/development-voting";

const statusClasses: Record<
  string,
  string
> = {
  scheduled:
    "bg-blue-50 text-blue-700 ring-blue-100",

  voting:
    "bg-amber-50 text-amber-700 ring-amber-100",

  finished:
    "bg-zinc-100 text-zinc-600 ring-zinc-200",

  closed:
    "bg-[#e8f2ed] text-[#0f3d2e] ring-[#d7e8df]",
};

export default async function ManageMatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } =
    await params;

  let matchId: string;

  try {
    matchId =
      parseMatchId(id);
  } catch {
    notFound();
  }

  let match;

  try {
    match =
      await getMatchById(
        matchId,
      );
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
              ← Match Admin
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Gestión de partido
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Convocatoria
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-red-50 p-5">
            <p className="font-black text-red-700">
              No se pudo cargar el partido.
            </p>

            <p className="mt-2 text-sm text-red-600">
              Inténtalo de nuevo.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!match) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <h1 className="text-2xl font-black text-zinc-950">
          Partido no encontrado
        </h1>

        <Link
          href="/match-admin"
          className="mt-5 inline-flex text-sm font-black text-[#0f3d2e]"
        >
          ← Volver a partidos
        </Link>
      </main>
    );
  }

  let loaded;

  try {
    loaded =
      await Promise.all([
        getTeams(),
        getCompetitions(),
        getMatchPlayers(
          match.id,
        ),
        getEligibleSquadPlayers(
          match,
        ),
      ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <h1 className="text-2xl font-black text-zinc-950">
          Convocatoria
        </h1>

        <p
          role="alert"
          className="mt-5 rounded-[1.3rem] bg-red-50 p-4 text-sm font-bold text-red-700"
        >
          No se pudo cargar la convocatoria o los datos del partido.
        </p>
      </main>
    );
  }

  const [
    teams,
    competitions,
    squad,
    eligible,
  ] = loaded;

  const teamNames =
    new Map(
      teams.map(
        (team) => [
          team.id,
          team.name,
        ],
      ),
    );

  const selected =
    new Set(
      squad.map(
        (entry) =>
          entry.player_id,
      ),
    );

  const available =
    eligible.filter(
      (player) =>
        !selected.has(
          player.id,
        ),
    );

  const competition =
    competitions.find(
      (item) =>
        item.id ===
        match.competition_id,
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

  const date =
    new Intl.DateTimeFormat(
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
      new Date(
        match.match_date,
      ),
    );

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/match-admin/${match.id}`}
            className="text-sm font-bold text-white/70"
          >
            ← Volver al partido
          </Link>

          <div className="mt-7 flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
                Match Admin
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight">
                Convocatoria
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Jugadores disponibles para el partido
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
              {matchStatusLabels[
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
              {date}
            </p>

            {competition && (
              <p className="mt-1 text-[10px] font-semibold text-zinc-400">
                {competition.name}
              </p>
            )}
          </div>
        </section>

        {/* RESUMEN */}
        <section className="mt-4 grid grid-cols-3 gap-2">
          <SummaryCard
            value={
              squad.length
            }
            label="Convocados"
            highlight
          />

          <SummaryCard
            value={
              available.length
            }
            label="Disponibles"
          />

          <SummaryCard
            value={
              eligible.length
            }
            label="Plantilla"
          />
        </section>

        {/* ATAJOS */}
        <section className="mt-4 grid grid-cols-2 gap-2">
          <Link
            href={`/match-admin/${match.id}/stats`}
            className="rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
              Partido
            </p>

            <p className="mt-1 font-black text-zinc-950">
              Estadísticas
            </p>
          </Link>

          <Link
            href={`/match-admin/${match.id}/results`}
            className="rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5"
          >
            <p className="text-[9px] font-black uppercase tracking-wide text-zinc-400">
              Resumen
            </p>

            <p className="mt-1 font-black text-zinc-950">
              Resultados / MVP
            </p>
          </Link>
        </section>

        {/* AÑADIR */}
        <section className="mt-8">
          <div className="px-1">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Plantilla
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
              Añadir jugador
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Selecciona un jugador activo para incorporarlo a la convocatoria.
            </p>
          </div>

          <div className="mt-4 rounded-[1.5rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            {available.length ===
            0 ? (
              <div className="py-3 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg">
                  ✓
                </div>

                <p className="mt-3 font-black text-zinc-950">
                  No hay jugadores disponibles
                </p>

                <p className="mt-1 text-xs text-zinc-500">
                  Todos los jugadores elegibles ya están convocados.
                </p>
              </div>
            ) : (
              <CreateForm
                action={addMatchPlayerAction.bind(
                  null,
                  match.id,
                )}
                disabled={
                  available.length ===
                  0
                }
                submitLabel="Añadir a convocatoria"
                fields={[
                  {
                    name:
                      "player_id",

                    label:
                      "Jugador",

                    required:
                      true,

                    options:
                      available.map(
                        (player) => ({
                          value:
                            player.id,

                          label:
                            `${player.first_name} ${
                              player.last_name ??
                              ""
                            } · ${
                              teamNames.get(
                                player.team_id,
                              ) ??
                              "Equipo"
                            } · ${
                              player.position
                            }${
                              player.shirt_number ===
                              null
                                ? ""
                                : ` · #${player.shirt_number}`
                            }`,
                        }),
                      ),
                  },
                ]}
              />
            )}
          </div>
        </section>

        {/* CONVOCADOS */}
        <section className="mt-8">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Partido
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Convocados
              </h2>

              <p className="mt-1 text-sm text-zinc-500">
                Jugadores incluidos para este encuentro.
              </p>
            </div>

            <span className="rounded-full bg-[#e8f2ed] px-3 py-1.5 text-xs font-black text-[#0f3d2e]">
              {squad.length}
            </span>
          </div>

          {squad.length ===
          0 ? (
            <div className="mt-4 rounded-[1.5rem] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
                👥
              </div>

              <p className="mt-4 font-black text-zinc-950">
                Convocatoria vacía
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Añade jugadores utilizando el selector superior.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {squad.map(
                (entry) => {
                  const name =
                    entry.player
                      ? `${entry.player.first_name} ${
                          entry.player.last_name ??
                          ""
                        }`.trim()
                      : "Jugador no disponible";

                  return (
                    <article
                      key={
                        entry.id
                      }
                      className="flex items-center gap-3 rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] font-black text-white">
                        {entry.player
                          ?.shirt_number ??
                          "—"}
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="truncate font-black text-zinc-950">
                          {name}
                        </h3>

                        <p className="mt-1 truncate text-xs font-semibold text-zinc-500">
                          {entry.team
                            ?.name ??
                            "Equipo no disponible"}
                          {" · "}
                          {entry.player
                            ?.position ??
                            "Sin posición"}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <CreateForm
                          action={removeMatchPlayerAction.bind(
                            null,
                            match.id,
                            entry.id,
                          )}
                          fields={[]}
                          submitLabel="Quitar"
                        />
                      </div>
                    </article>
                  );
                },
              )}
            </div>
          )}
        </section>

        {/* EDITAR PARTIDO */}
        <section className="mt-8">
          <Link
            href={`/admin/matches/${match.id}/edit`}
            className="flex min-h-14 w-full items-center justify-between rounded-[1.3rem] bg-[#e8f2ed] px-5"
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
                Configuración
              </p>

              <p className="mt-1 font-black text-[#0b2f23]">
                Editar datos del partido
              </p>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0f3d2e] font-black text-white">
              →
            </span>
          </Link>
        </section>

        {match.status ===
          "voting" &&
          isDevelopmentVotingEnabled() && (
            <section className="mt-3">
              <Link
                href={`/matches/${match.id}/vote`}
                className="flex min-h-12 w-full items-center justify-center rounded-[1.2rem] bg-amber-50 px-4 text-sm font-black text-amber-700"
              >
                Votar en desarrollo
              </Link>
            </section>
          )}
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