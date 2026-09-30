import Link from "next/link";
import { notFound } from "next/navigation";

import { getMatchById } from "@/data/matches";
import { getMatchPlayers } from "@/data/match-players";

import StatsManager from "./stats-manager";

export default async function MatchStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } =
    await params;

  let match;
  let players;

  try {
    [match, players] =
      await Promise.all([
        getMatchById(id),
        getMatchPlayers(id),
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
              Estadísticas
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
            Estadísticas
          </h1>

          <p className="mt-2 max-w-sm text-sm leading-6 text-white/65">
            Configura el once y registra el rendimiento de cada jugador.
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
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
              starters
            }
            label="Titulares"
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
                Añade titulares desde el campo y pulsa cualquier jugador para registrar minutos, goles, asistencias y tarjetas.
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
              matchId={id}
              players={players.map(
                (entry) => ({
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
                    entry.team?.name ??
                    "Equipo no disponible",

                  starter:
                    entry.starter,

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