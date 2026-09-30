import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getFantasyLeagueById } from "@/data/fantasy-leagues";
import { getFantasyMatchPoints } from "@/data/fantasy-match-points";
import { getMatchById } from "@/data/matches";
import { getTeams } from "@/data/teams";

type FantasyLine = "GK" | "DEF" | "MID" | "FWD";

function getLine(
  position: string | null,
): FantasyLine {
  if (position === "GK") {
    return "GK";
  }

  if (
    position === "RB" ||
    position === "CB" ||
    position === "LB" ||
    position === "RWB" ||
    position === "LWB"
  ) {
    return "DEF";
  }

  if (
    position === "DM" ||
    position === "CM" ||
    position === "AM"
  ) {
    return "MID";
  }

  return "FWD";
}

export default async function FantasyMatchPointsPage({
  params,
}: {
  params: Promise<{
    id: string;
    matchId: string;
  }>;
}) {
  const user = await requireUser();

  const {
    id: leagueId,
    matchId,
  } = await params;

  const [league, match] =
    await Promise.all([
      getFantasyLeagueById(leagueId),
      getMatchById(matchId),
    ]);

  if (!league || !match) {
    notFound();
  }

  const result =
    await getFantasyMatchPoints({
      leagueId,
      userId: user.id,
      matchId,
    });

  const teams =
    await getTeams();

  const teamNames =
    new Map(
      teams.map((team) => [
        team.id,
        team.name,
      ]),
    );

  const homeTeam =
    teamNames.get(
      match.home_team_id,
    ) ?? "Equipo local";

  const awayTeam =
    teamNames.get(
      match.away_team_id,
    ) ?? "Equipo visitante";

  const hasResult =
    match.home_score !== null &&
    match.away_score !== null;

  if (
    result.status !== "ready"
  ) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
        <Link
          href={`/fantasy/leagues/${leagueId}`}
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a la liga
        </Link>

        <h1 className="mt-5 text-3xl font-bold text-zinc-950">
          Puntos de la jornada
        </h1>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          {result.status ===
          "not_found" ? (
            <p className="font-semibold text-zinc-950">
              No existe una alineación guardada para este partido.
            </p>
          ) : (
            <>
              <p className="font-bold text-amber-900">
                Puntos todavía no disponibles
              </p>

              <p className="mt-2 text-sm text-zinc-600">
                {result.reason}
              </p>
            </>
          )}
        </section>
      </main>
    );
  }

  const starters =
    result.players.filter(
      (player) => player.starter,
    );

  const substitutes =
    result.players.filter(
      (player) =>
        !player.starter,
    );

  const startersByLine: Record<
    FantasyLine,
    typeof starters
  > = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };

  for (const player of starters) {
    startersByLine[
      getLine(player.position)
    ].push(player);
  }

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
      <header>
        <Link
          href={`/fantasy/leagues/${leagueId}`}
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a la liga
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          {league.name}
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Puntos de la jornada
        </h1>
      </header>

      <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className="font-bold text-zinc-950">
            {homeTeam}
          </p>

          <div className="text-center">
            {hasResult ? (
              <p className="text-2xl font-black text-zinc-950">
                {match.home_score} -{" "}
                {match.away_score}
              </p>
            ) : (
              <p className="font-bold text-zinc-400">
                VS
              </p>
            )}
          </div>

          <p className="text-right font-bold text-zinc-950">
            {awayTeam}
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-zinc-500">
          {new Intl.DateTimeFormat(
            "es-ES",
            {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone:
                "Europe/Madrid",
            },
          ).format(
            new Date(
              match.match_date,
            ),
          )}
        </p>
      </section>

      <section className="mt-6 rounded-2xl bg-zinc-950 p-5 text-white shadow-sm">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-300">
          Tu puntuación
        </p>

        <div className="mt-2 flex items-end gap-2">
          <p className="text-5xl font-black">
            {result.total_points}
          </p>

          <p className="pb-1 text-lg font-bold text-zinc-300">
            pts
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              Titulares
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Jugadores marcados como titular en las estadísticas
            </p>
          </div>

          <span className="text-sm text-zinc-500">
            {starters.length}
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-3xl bg-emerald-700 p-3 shadow-lg ring-1 ring-emerald-800">
          <div className="relative min-h-[570px] overflow-hidden rounded-2xl border-2 border-white/70">
            <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/60" />

            <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

            <div className="absolute left-1/2 top-0 h-16 w-40 -translate-x-1/2 border-x-2 border-b-2 border-white/60" />

            <div className="absolute bottom-0 left-1/2 h-16 w-40 -translate-x-1/2 border-x-2 border-t-2 border-white/60" />

            <div className="relative z-10 flex min-h-[570px] flex-col justify-between px-2 py-5">
              <ResultFieldRow
                players={
                  startersByLine.FWD
                }
              />

              <ResultFieldRow
                players={
                  startersByLine.MID
                }
              />

              <ResultFieldRow
                players={
                  startersByLine.DEF
                }
              />

              <ResultFieldRow
                players={
                  startersByLine.GK
                }
              />
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-zinc-950">
              Banquillo
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Jugadores de tu XI que no fueron titulares
            </p>
          </div>

          <span className="text-sm text-zinc-500">
            {substitutes.length}
          </span>
        </div>

        {substitutes.length ===
        0 ? (
          <div className="mt-4 rounded-2xl bg-white p-5 text-sm text-zinc-500 shadow-sm ring-1 ring-zinc-200">
            No hay jugadores del XI en el banquillo.
          </div>
        ) : (
          <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
            {substitutes.map(
              (player) => (
                <PlayerPointsRow
                  key={
                    player.player_id
                  }
                  player={player}
                />
              ),
            )}
          </div>
        )}
      </section>
    </main>
  );
}

function ResultFieldRow({
  players,
}: {
  players: {
    player_id: string;
    player_name: string;
    shirt_number: number | null;
    position: string | null;
    minutes_played: number;
    final_rating: number | null;
    points: number;
  }[];
}) {
  if (players.length === 0) {
    return (
      <div className="h-16" />
    );
  }

  return (
    <div
      className="grid items-start justify-items-center gap-1"
      style={{
        gridTemplateColumns: `repeat(${players.length}, minmax(0, 1fr))`,
      }}
    >
      {players.map(
        (player) => (
          <div
            key={
              player.player_id
            }
            className="flex w-full max-w-[92px] flex-col items-center text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-black text-emerald-800 shadow-md">
              {player.shirt_number ??
                "—"}
            </div>

            <span className="mt-1 max-w-full truncate rounded-md bg-zinc-950/80 px-2 py-1 text-[10px] font-bold text-white">
              {
                player.player_name
              }
            </span>

            <span className="mt-1 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-black text-zinc-950">
              {player.points} pts
            </span>

            <span className="mt-1 text-[9px] font-semibold text-white/80">
              {
                player.minutes_played
              }{" "}
              min
            </span>
          </div>
        ),
      )}
    </div>
  );
}

function PlayerPointsRow({
  player,
}: {
  player: {
    player_id: string;
    player_name: string;
    shirt_number: number | null;
    position: string | null;
    minutes_played: number;
    final_rating: number | null;
    points: number;
  };
}) {
  return (
    <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 font-bold text-zinc-700">
          {player.shirt_number ??
            "—"}
        </span>

        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-950">
            {player.player_name}
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            {player.position ??
              "Sin posición"}
            {" · "}
            {
              player.minutes_played
            }{" "}
            min
          </p>
        </div>
      </div>

      <div className="ml-3 flex items-center gap-5">
        <div className="text-right">
          <p className="text-sm font-semibold text-zinc-700">
            {player.final_rating !==
            null
              ? player.final_rating.toFixed(
                  2,
                )
              : "—"}
          </p>

          <p className="text-[10px] uppercase text-zinc-400">
            nota
          </p>
        </div>

        <div className="min-w-12 text-right">
          <p className="text-xl font-black text-zinc-950">
            {player.points}
          </p>

          <p className="text-[10px] uppercase text-zinc-400">
            pts
          </p>
        </div>
      </div>
    </div>
  );
}