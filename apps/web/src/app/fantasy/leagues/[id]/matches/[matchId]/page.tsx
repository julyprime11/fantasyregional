import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getFantasyLeagueById } from "@/data/fantasy-leagues";
import { getFantasyMatchPoints } from "@/data/fantasy-match-points";
import { getMatchById } from "@/data/matches";
import { getTeams } from "@/data/teams";

type FantasyLine =
  | "GK"
  | "DEF"
  | "MID"
  | "FWD";

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
      getFantasyLeagueById(
        leagueId,
      ),
      getMatchById(
        matchId,
      ),
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

  const matchDateLabel =
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

  /*
   * ESTADO SIN PUNTOS
   */
  if (
    result.status !==
    "ready"
  ) {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-5 text-white">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="relative z-10">
            <Link
              href={`/fantasy/leagues/${leagueId}`}
              className="text-sm font-bold text-white/70"
            >
              ← Volver a la liga
            </Link>

            <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
              {league.name}
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Jornada
            </h1>

            <p className="mt-1 text-sm text-white/60">
              Resumen Fantasy
            </p>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-5 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            {result.status ===
            "not_found" ? (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
                  ⚽
                </div>

                <p className="mt-4 font-black text-zinc-950">
                  No hay XI guardado
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  No existe una alineación guardada para este partido.
                </p>
              </>
            ) : (
              <>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-xl">
                  ⏳
                </div>

                <p className="mt-4 font-black text-amber-900">
                  Puntos todavía no disponibles
                </p>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  {result.reason}
                </p>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  /*
   * TITULARES / SUPLENTES
   */
  const starters =
    result.players.filter(
      (player) =>
        player.starter,
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

  for (
    const player of
    starters
  ) {
    startersByLine[
      getLine(
        player.position,
      )
    ].push(player);
  }

  /*
   * DATOS RESUMEN
   */
  const sortedPlayers = [
    ...result.players,
  ].sort(
    (a, b) =>
      b.points -
      a.points,
  );

  const bestPlayer =
    sortedPlayers[0] ??
    null;

  const averagePoints =
    result.players.length >
    0
      ? result.total_points /
        result.players.length
      : 0;

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-5 text-white">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/fantasy/leagues/${leagueId}`}
            className="text-sm font-bold text-white/70"
          >
            ← Volver a la liga
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            {league.name}
          </p>

          <div className="mt-2 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Jornada
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Tu rendimiento Fantasy
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wide text-white/50">
                Puntos
              </p>

              <p className="text-2xl font-black">
                {result.total_points}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* MARCADOR */}
        <section className="relative z-10 -mt-1 pt-5">
          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
            <div className="px-5 py-5">
              <p className="text-center text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                Resultado
              </p>

              <div className="mt-5 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg">
                    ⚽
                  </div>

                  <p className="mt-2 text-sm font-black leading-5 text-zinc-950">
                    {homeTeam}
                  </p>
                </div>

                <div className="text-center">
                  {hasResult ? (
                    <div className="rounded-2xl bg-zinc-950 px-4 py-3 text-white">
                      <p className="whitespace-nowrap text-2xl font-black">
                        {match.home_score}
                        <span className="mx-2 text-zinc-500">
                          -
                        </span>
                        {match.away_score}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-xl bg-zinc-100 px-4 py-3 text-xs font-black text-zinc-400">
                      VS
                    </div>
                  )}
                </div>

                <div className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-lg">
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
                {matchDateLabel}
              </p>
            </div>
          </div>
        </section>

        {/* PUNTUACIÓN */}
        <section className="mt-4 overflow-hidden rounded-[1.6rem] bg-zinc-950 p-5 text-white shadow-lg">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
            Tu puntuación
          </p>

          <div className="mt-2 flex items-end justify-between">
            <div className="flex items-end">
              <p className="text-6xl font-black tracking-tight">
                {result.total_points}
              </p>

              <p className="mb-2 ml-2 text-sm font-black text-zinc-400">
                pts
              </p>
            </div>

            <div className="text-right">
              <p className="text-[9px] font-black uppercase tracking-wide text-zinc-500">
                Media XI
              </p>

              <p className="mt-1 text-xl font-black">
                {averagePoints.toFixed(
                  1,
                )}
              </p>
            </div>
          </div>

          <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full rounded-full bg-[#17814f]" />
          </div>
        </section>

        {/* DESTACADO */}
        {bestPlayer && (
          <section className="mt-4 rounded-[1.4rem] bg-[#e8f2ed] p-4">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-xl">
                ⭐
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
                  Mejor de tu XI
                </p>

                <p className="mt-1 truncate font-black text-[#0b2f23]">
                  {bestPlayer.player_name}
                </p>

                <p className="mt-0.5 text-xs font-semibold text-[#557368]">
                  {bestPlayer.minutes_played} min
                  {bestPlayer.final_rating !==
                  null
                    ? ` · Nota ${bestPlayer.final_rating.toFixed(
                        2,
                      )}`
                    : ""}
                </p>
              </div>

              <div className="text-right">
                <p className="text-3xl font-black text-[#0f3d2e]">
                  {bestPlayer.points}
                </p>

                <p className="text-[9px] font-black uppercase text-[#557368]">
                  pts
                </p>
              </div>
            </div>
          </section>
        )}

        {/* TITULARES */}
        <section className="mt-9">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Tu equipo
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Titulares
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
              {starters.length}
            </span>
          </div>

          <p className="mt-2 px-1 text-xs leading-5 text-zinc-500">
            Jugadores de tu XI que fueron titulares en el partido.
          </p>

          <div className="mt-4 overflow-hidden rounded-[1.7rem] bg-[#087443] p-2.5 shadow-xl ring-1 ring-black/10">
            <div
              className="relative min-h-[560px] overflow-hidden rounded-[1.35rem] border-2 border-white/70"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,255,255,0.045) 50%, transparent 50%)",
                backgroundSize:
                  "64px 64px",
              }}
            >
              <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/60" />

              <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

              <div className="absolute left-1/2 top-0 h-16 w-40 -translate-x-1/2 border-x-2 border-b-2 border-white/60" />

              <div className="absolute bottom-0 left-1/2 h-16 w-40 -translate-x-1/2 border-x-2 border-t-2 border-white/60" />

              <div className="relative z-10 flex min-h-[560px] flex-col justify-between px-2 py-5">
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

        {/* DESGLOSE */}
        <section className="mt-9">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Rendimiento
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Desglose
              </h2>
            </div>

            <span className="text-xs font-bold text-zinc-400">
              {result.players.length} jugadores
            </span>
          </div>

          <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
            {[...result.players]
              .sort(
                (a, b) =>
                  b.points -
                  a.points,
              )
              .map(
                (
                  player,
                  index,
                ) => (
                  <PlayerPointsRow
                    key={
                      player.player_id
                    }
                    player={
                      player
                    }
                    position={
                      index + 1
                    }
                  />
                ),
              )}
          </div>
        </section>

        {/* BANQUILLO */}
        <section className="mt-9">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Partido real
              </p>

              <h2 className="mt-1 text-xl font-black text-zinc-950">
                Banquillo
              </h2>
            </div>

            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-black text-zinc-500">
              {substitutes.length}
            </span>
          </div>

          <p className="mt-2 px-1 text-xs leading-5 text-zinc-500">
            Jugadores de tu XI que no salieron como titulares.
          </p>

          {substitutes.length ===
          0 ? (
            <div className="mt-4 rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
              <p className="text-sm font-semibold text-zinc-500">
                Todos los jugadores de tu XI fueron titulares.
              </p>
            </div>
          ) : (
            <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
              {substitutes.map(
                (player) => (
                  <PlayerPointsRow
                    key={
                      player.player_id
                    }
                    player={
                      player
                    }
                  />
                ),
              )}
            </div>
          )}
        </section>
      </div>
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
  if (
    players.length === 0
  ) {
    return (
      <div className="h-16" />
    );
  }

  return (
    <div
      className="grid items-start justify-items-center gap-1"
      style={{
        gridTemplateColumns:
          `repeat(${players.length}, minmax(0, 1fr))`,
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
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-black text-[#0f5e3d] shadow-md ring-2 ring-white/30">
                {player.shirt_number ??
                  "—"}
              </div>

              <div className="absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full bg-zinc-950 px-1.5 text-[9px] font-black text-white shadow">
                {player.points}
              </div>
            </div>

            <span className="mt-1 max-w-full truncate rounded-md bg-zinc-950/85 px-2 py-1 text-[9px] font-black text-white">
              {player.player_name}
            </span>

            <span className="mt-1 text-[8px] font-bold text-white/75">
              {player.minutes_played} min
            </span>
          </div>
        ),
      )}
    </div>
  );
}

function PlayerPointsRow({
  player,
  position,
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
  position?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-4 last:border-b-0">
      <div className="flex min-w-0 items-center gap-3">
        {position ? (
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              position === 1
                ? "bg-[#0f3d2e] text-white"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {position}
          </span>
        ) : (
          <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] font-black text-[#0f3d2e]">
            {player.shirt_number ??
              "—"}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-sm font-black text-zinc-950">
            {player.player_name}
          </p>

          <div className="mt-1 flex items-center gap-2 text-[10px] font-semibold text-zinc-400">
            <span>
              {player.position ??
                "—"}
            </span>

            <span>
              •
            </span>

            <span>
              {player.minutes_played} min
            </span>

            {!position &&
              player.final_rating !==
                null && (
                <>
                  <span>
                    •
                  </span>

                  <span>
                    Nota{" "}
                    {player.final_rating.toFixed(
                      2,
                    )}
                  </span>
                </>
              )}
          </div>
        </div>
      </div>

      <div className="shrink-0 text-right">
        {position &&
          player.final_rating !==
            null && (
            <p className="text-[10px] font-bold text-zinc-400">
              Nota{" "}
              {player.final_rating.toFixed(
                2,
              )}
            </p>
          )}

        <p
          className={`font-black ${
            player.points > 0
              ? "text-[#0f3d2e]"
              : player.points < 0
                ? "text-red-600"
                : "text-zinc-500"
          } ${
            position
              ? "text-xl"
              : "text-2xl"
          }`}
        >
          {player.points}
          <span className="ml-1 text-[9px] font-black uppercase text-zinc-400">
            pts
          </span>
        </p>
      </div>
    </div>
  );
}