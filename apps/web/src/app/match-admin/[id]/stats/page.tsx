import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  getLiveMatchById,
  getMatchById,
} from "@/data/matches";

import {
  getMatchPlayers,
} from "@/data/match-players";

import {
  getMatchEvents,
} from "@/data/match-events";

import {
  getTeams,
} from "@/data/teams";

import LiveMatchController from "./live-match-controller";
import MatchTimeline from "./match-timeline";
import StatsManager from "./stats-manager";

export default async function MatchStatsPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const { id } =
    await params;

  let match;
  let liveMatch;
  let players;
  let teams;
  let events;

  try {
    [
      match,
      liveMatch,
      players,
      teams,
      events,
    ] =
      await Promise.all([
        getMatchById(
          id,
        ),

        getLiveMatchById(
          id,
        ),

        getMatchPlayers(
          id,
        ),

        getTeams(),

        getMatchEvents(
          id,
        ),
      ]);
  } catch {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <Link
              href={`/match-admin/${id}`}
              className="text-sm font-bold text-white/70"
            >
              ← Volver al partido
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Match Admin
            </p>

            <h1 className="mt-2 text-3xl font-black">
              Partido en directo
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-red-50 p-5">
            <p className="font-black text-red-700">
              No se pudieron cargar los datos del partido.
            </p>
          </section>
        </div>
      </main>
    );
  }

  if (!match) {
    notFound();
  }

  const completed =
    players.filter(
      (player) =>
        player.stats_completed,
    ).length;

  const starters =
    players.filter(
      (player) =>
        player.starter,
    ).length;

  const onField =
    players.filter(
      (player) =>
        player.on_field,
    ).length;

  /*
   * NOMBRES DE LOS EQUIPOS
   */
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

  /*
   * NOMBRES DE JUGADORES PARA
   * LA CRONOLOGÍA DE EVENTOS
   */
  const playerNames =
    Object.fromEntries(
      players.map(
        (entry) => [
          entry.player_id,

          entry.player
            ? `${entry.player.first_name} ${
                entry.player.last_name ??
                ""
              }`.trim()
            : "Jugador",
        ],
      ),
    );

  /*
   * EQUIPOS GESTIONADOS
   *
   * Los detectamos automáticamente
   * a partir de match_players.
   *
   * Ahora:
   * - si solo tenemos jugadores del Castelló,
   *   aparecerá únicamente Castelló.
   *
   * Futuro:
   * - si también cargamos jugadores del rival,
   *   aparecerán automáticamente los dos equipos.
   *
   * No dependemos del nombre del club.
   * Trabajamos siempre con team_id.
   */
  const managedTeamsMap =
    new Map<
      string,
      {
        id: string;
        name: string;
        cleanSheet: boolean;
      }
    >();

  for (
    const entry of
    players
  ) {
    const current =
      managedTeamsMap.get(
        entry.team_id,
      );

    const teamName =
      entry.team?.name ??
      teamNames.get(
        entry.team_id,
      ) ??
      "Equipo";

    if (!current) {
      managedTeamsMap.set(
        entry.team_id,
        {
          id:
            entry.team_id,

          name:
            teamName,

          cleanSheet:
            entry.clean_sheet,
        },
      );

      continue;
    }

    /*
     * El equipo se considera con
     * portería a cero únicamente si
     * todos sus match_players tienen
     * clean_sheet=true.
     */
    current.cleanSheet =
      current.cleanSheet &&
      entry.clean_sheet;
  }

  const managedTeams =
    Array.from(
      managedTeamsMap.values(),
    );

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/match-admin/${id}`}
            className="text-sm font-bold text-white/70"
          >
            ← Volver al partido
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
            Match Admin
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            Partido en directo
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
            Controla el tiempo, las sustituciones y las estadísticas mientras se juega.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* MATCH CENTER */}
        <section className="mt-5">
          <LiveMatchController
            matchId={
              id
            }
            homeTeam={
              homeTeam
            }
            awayTeam={
              awayTeam
            }
            homeScore={
              match.home_score
            }
            awayScore={
              match.away_score
            }
            phase={
              liveMatch.live_phase
            }
            clockSeconds={
              liveMatch.live_clock_seconds
            }
            clockStartedAt={
              liveMatch.live_clock_started_at
            }
            managedTeams={
              managedTeams
            }
          />
        </section>

        {/* CRONOLOGÍA */}
        <section className="mt-5">
          <MatchTimeline
            matchId={
              id
            }
            initialEvents={events.map(
              (
                event,
              ) => ({
                id:
                  event.id,

                matchId:
                  event.match_id,

                eventType:
                  event.event_type,

                playerId:
                  event.player_id,

                secondaryPlayerId:
                  event.secondary_player_id,

                minute:
                  event.minute,

                createdAt:
                  event.created_at,
              }),
            )}
            playerNames={
              playerNames
            }
          />
        </section>

        {/* RESUMEN */}
        <section className="mt-5 grid grid-cols-3 gap-2">
          <Summary
            value={
              players.length
            }
            label="Convocados"
          />

          <Summary
            value={
              liveMatch.live_phase ===
              "not_started"
                ? starters
                : onField
            }
            label={
              liveMatch.live_phase ===
              "not_started"
                ? "Titulares"
                : "En campo"
            }
          />

          <Summary
            value={
              completed
            }
            label="Completados"
            highlight
          />
        </section>

        {/* EXPLICACIÓN */}
        <section className="mt-4 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-white">
              ⚽
            </div>

            <div>
              <p className="font-black text-[#0b2f23]">
                Once y estadísticas
              </p>

              <p className="mt-1 text-xs leading-5 text-[#557368]">
                Antes del partido configura el XI. Durante el directo, pulsa un jugador para registrar estadísticas o realizar una sustitución.
              </p>
            </div>
          </div>
        </section>

        {players.length ===
        0 ? (
          <section className="mt-6 rounded-[1.5rem] bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
              👥
            </div>

            <p className="mt-4 font-black text-zinc-950">
              No hay jugadores en la convocatoria
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Añade primero los jugadores que participarán en el partido.
            </p>

            <Link
              href={`/admin/matches/${id}`}
              className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[1.1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white"
            >
              Gestionar convocatoria →
            </Link>
          </section>
        ) : (
          <section className="mt-8">
            <StatsManager
              matchId={
                id
              }
              livePhase={
                liveMatch.live_phase
              }
              players={players.map(
                (
                  entry,
                ) => ({
                  entryId:
                    entry.id,

                  playerId:
                    entry.player_id,

                  name:
                    entry.player
                      ? `${entry.player.first_name} ${
                          entry.player.last_name ??
                          ""
                        }`.trim()
                      : "Jugador no disponible",

                  shirtNumber:
                    entry.player
                      ?.shirt_number ??
                    null,

                  position:
                    entry.player
                      ?.position ??
                    "Sin posición",

                  teamId:
                    entry.team_id,

                  teamName:
                    entry.team
                      ?.name ??
                    "Equipo no disponible",

                  starter:
                    entry.starter,

                  onField:
                    entry.on_field,

                  enteredMinute:
                    entry.entered_minute,

                  statsCompleted:
                    entry.stats_completed,

                  minutesPlayed:
                    entry.minutes_played,

                  goals:
                    entry.goals,

                  assists:
                    entry.assists,

                  yellowCards:
                    entry.yellow_cards,

                  redCards:
                    entry.red_cards,

                  cleanSheet:
                    entry.clean_sheet,
                }),
              )}
            />
          </section>
        )}
      </div>
    </main>
  );
}

function Summary({
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