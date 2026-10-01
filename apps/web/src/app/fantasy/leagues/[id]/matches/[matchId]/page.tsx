import Link from "next/link";

import { requireUser } from "@/lib/auth";

import {
  getFantasyLeagueById,
  getFantasyLeagueMembers,
} from "@/data/fantasy-leagues";

import {
  getFantasyMatchPoints,
} from "@/data/fantasy-match-points";

import {
  getMatchById,
} from "@/data/matches";

import {
  getTeams,
} from "@/data/teams";

type FantasyLine =
  | "GK"
  | "DEF"
  | "MID"
  | "FWD";

type FantasyPlayer = {
  player_id: string;
  player_name: string;
  shirt_number: number | null;
  position: string | null;

  starter: boolean;
  minutes_played: number;

  final_rating: number | null;
  points: number;
  rateable: boolean;
};

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
  searchParams,
}: {
  params: Promise<{
    id: string;
    matchId: string;
  }>;

  searchParams: Promise<{
    user?: string | string[];
  }>;
}) {
  const user =
    await requireUser();

  const {
    id: leagueId,
    matchId,
  } =
    await params;

  const [
    league,
    match,
    members,
  ] =
    await Promise.all([
      getFantasyLeagueById(
        leagueId,
      ),

      getMatchById(
        matchId,
      ),

      getFantasyLeagueMembers(
        leagueId,
      ),
    ]);

  if (
    !league ||
    !match
  ) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
        <section className="rounded-[1.5rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No se pudo cargar la jornada
          </p>

          <p className="mt-2 text-sm text-red-600">
            La liga o el partido ya no están disponibles.
          </p>

          <Link
            href={`/fantasy/leagues/${leagueId}`}
            className="mt-5 inline-flex font-black text-red-700 underline"
          >
            ← Volver a la liga
          </Link>
        </section>
      </main>
    );
  }

  const currentMember =
    members.find(
      (member) =>
        member.user_id ===
        user.id,
    );

  if (!currentMember) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-8">
        <section className="rounded-[1.5rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No tienes acceso a esta liga
          </p>

          <p className="mt-2 text-sm text-red-600">
            Debes pertenecer a la liga para consultar sus alineaciones.
          </p>

          <Link
            href="/fantasy/leagues"
            className="mt-5 inline-flex font-black text-red-700 underline"
          >
            ← Volver a mis ligas
          </Link>
        </section>
      </main>
    );
  }

  const query =
    await searchParams;

  const requestedUser =
    typeof query.user ===
    "string"
      ? query.user
      : null;

  const selectedMember =
    requestedUser
      ? members.find(
          (member) =>
            member.user_id ===
            requestedUser,
        ) ??
        currentMember
      : currentMember;

  const selectedUserId =
    selectedMember.user_id;

  const isOwnLineup =
    selectedUserId ===
    user.id;

  const selectedName =
    selectedMember.profile
      ?.display_name ??
    (isOwnLineup
      ? "Tú"
      : "Jugador");

  const result =
    await getFantasyMatchPoints({
      leagueId,
      userId:
        selectedUserId,
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
    match.home_score !==
      null &&
    match.away_score !==
      null;

  const matchDateLabel =
    new Intl.DateTimeFormat(
      "es-ES",
      {
        weekday:
          "short",

        day:
          "numeric",

        month:
          "short",

        hour:
          "2-digit",

        minute:
          "2-digit",

        timeZone:
          "Europe/Madrid",
      },
    ).format(
      new Date(
        match.match_date,
      ),
    );

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

        <div className="px-4 pb-8">
          <LineupSelector
            members={
              members
            }
            leagueId={
              leagueId
            }
            matchId={
              matchId
            }
            currentUserId={
              user.id
            }
            selectedUserId={
              selectedUserId
            }
          />

          <section className="mt-4 rounded-[1.3rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
            {result.status ===
            "not_found" ? (
              <>
                <p className="font-black text-zinc-950">
                  {isOwnLineup
                    ? "No hay XI guardado"
                    : `${selectedName} no guardó un XI`}
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {isOwnLineup
                    ? "No existe una alineación guardada para este partido."
                    : `No existe una alineación de ${selectedName} para esta jornada.`}
                </p>
              </>
            ) : (
              <>
                <p className="font-black text-amber-900">
                  Puntos todavía no disponibles
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  {result.reason}
                </p>
              </>
            )}
          </section>
        </div>
      </main>
    );
  }

  const playersByLine: Record<
    FantasyLine,
    FantasyPlayer[]
  > = {
    GK: [],
    DEF: [],
    MID: [],
    FWD: [],
  };

  for (
    const player of
    result.players
  ) {
    playersByLine[
      getLine(
        player.position,
      )
    ].push(
      player,
    );
  }

  const sortedPlayers = [
    ...result.players,
  ].sort(
    (a, b) =>
      b.points -
      a.points,
  );

  const bestPlayer =
    sortedPlayers.find(
      (player) =>
        player.minutes_played >
        0,
    ) ??
    sortedPlayers[0] ??
    null;

  const averagePoints =
    result.players.length >
    0
      ? result.total_points /
        result.players.length
      : 0;

  const playedCount =
    result.players.filter(
      (player) =>
        player.minutes_played >
        0,
    ).length;

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
      <header className="relative overflow-hidden rounded-b-[1.7rem] bg-[#0f3d2e] px-5 pb-6 pt-5 text-white">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="relative z-10">
          <Link
            href={`/fantasy/leagues/${leagueId}`}
            className="text-xs font-bold text-white/70"
          >
            ← Volver a la liga
          </Link>

          <p className="mt-5 text-[9px] font-black uppercase tracking-[0.2em] text-white/50">
            {league.name}
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black tracking-tight">
                Jornada
              </h1>

              <p className="mt-1 text-xs text-white/60">
                {isOwnLineup
                  ? "Tu rendimiento Fantasy"
                  : `Jornada de ${selectedName}`}
              </p>
            </div>

            <div className="shrink-0 rounded-xl bg-white/10 px-3 py-1.5 text-center">
              <p className="text-[7px] font-black uppercase tracking-wide text-white/50">
                Puntos
              </p>

              <p className="text-xl font-black">
                {result.total_points}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* MARCADOR COMPACTO */}
        <section className="relative z-10 -mt-1 pt-4">
          <div className="overflow-hidden rounded-[1.2rem] bg-white shadow-sm ring-1 ring-black/5">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1 text-right">
                <p className="text-[11px] font-black leading-4 text-zinc-950">
                  {homeTeam}
                </p>
              </div>

              <div className="shrink-0">
                {hasResult ? (
                  <div className="rounded-xl bg-zinc-950 px-3 py-2 text-white">
                    <p className="whitespace-nowrap text-lg font-black leading-none">
                      {match.home_score}

                      <span className="mx-1.5 text-zinc-500">
                        -
                      </span>

                      {match.away_score}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg bg-zinc-100 px-3 py-2 text-[9px] font-black text-zinc-400">
                    VS
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black leading-4 text-zinc-950">
                  {awayTeam}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-1.5 text-center">
              <p className="text-[9px] font-bold capitalize text-zinc-400">
                {matchDateLabel}
              </p>
            </div>
          </div>
        </section>

        {/* USUARIOS COMPACTOS */}
        <LineupSelector
          members={
            members
          }
          leagueId={
            leagueId
          }
          matchId={
            matchId
          }
          currentUserId={
            user.id
          }
          selectedUserId={
            selectedUserId
          }
        />

        {/* PUNTOS COMPACTOS */}
        <section className="mt-3 rounded-[1.2rem] bg-zinc-950 px-4 py-3 text-white shadow-md">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[7px] font-black uppercase tracking-[0.16em] text-zinc-500">
                {isOwnLineup
                  ? "Tus puntos"
                  : selectedName}
              </p>

              <div className="mt-0.5 flex items-end">
                <p className="text-3xl font-black leading-none">
                  {result.total_points}
                </p>

                <span className="mb-0.5 ml-1 text-[9px] font-black text-zinc-500">
                  pts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-center">
                <p className="text-base font-black">
                  {averagePoints.toFixed(
                    1,
                  )}
                </p>

                <p className="text-[7px] font-black uppercase tracking-wide text-zinc-500">
                  Media
                </p>
              </div>

              <div className="h-7 w-px bg-white/10" />

              <div className="text-center">
                <p className="text-base font-black">
                  {playedCount}
                  <span className="text-zinc-600">
                    /
                  </span>
                  {result.players.length}
                </p>

                <p className="text-[7px] font-black uppercase tracking-wide text-zinc-500">
                  Jugaron
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* MEJOR JUGADOR */}
        {bestPlayer && (
          <section className="mt-3 rounded-[1.2rem] bg-[#e8f2ed] px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-base">
                ⭐
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
                  {isOwnLineup
                    ? "Mejor de tu XI"
                    : `Mejor de ${selectedName}`}
                </p>

                <p className="truncate text-sm font-black text-[#0b2f23]">
                  {bestPlayer.player_name}
                </p>

                {bestPlayer.minutes_played >
                0 ? (
                  <p className="text-[10px] font-semibold text-[#557368]">
                    {bestPlayer.minutes_played} min

                    {bestPlayer.final_rating !==
                    null
                      ? ` · Nota ${bestPlayer.final_rating.toFixed(
                          2,
                        )}`
                      : ""}
                  </p>
                ) : (
                  <p className="text-[10px] font-bold text-zinc-500">
                    No jugó
                  </p>
                )}
              </div>

              <div className="text-right">
                <p className="text-2xl font-black text-[#0f3d2e]">
                  {bestPlayer.points}
                </p>

                <p className="text-[7px] font-black uppercase text-[#557368]">
                  pts
                </p>
              </div>
            </div>
          </section>
        )}

        {/* XI */}
        <section className="mt-7">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                {isOwnLineup
                  ? "Tu equipo"
                  : selectedName}
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                {isOwnLineup
                  ? "Tu XI"
                  : `XI de ${selectedName}`}
              </h2>
            </div>

            <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
              {result.players.length}/11
            </span>
          </div>

          <p className="mt-1.5 px-1 text-[11px] leading-5 text-zinc-500">
            {isOwnLineup
              ? "La alineación que elegiste para esta jornada."
              : `La alineación de ${selectedName} para esta jornada.`}{" "}
            Los jugadores que no participaron suman 0 puntos.
          </p>

          <div className="mt-3 overflow-hidden rounded-[1.5rem] bg-[#087443] p-2 shadow-xl ring-1 ring-black/10">
            <div
              className="relative min-h-[540px] overflow-hidden rounded-[1.2rem] border-2 border-white/70"
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

              <div className="relative z-10 flex min-h-[540px] flex-col justify-between px-2 py-5">
                <ResultFieldRow
                  players={
                    playersByLine.FWD
                  }
                />

                <ResultFieldRow
                  players={
                    playersByLine.MID
                  }
                />

                <ResultFieldRow
                  players={
                    playersByLine.DEF
                  }
                />

                <ResultFieldRow
                  players={
                    playersByLine.GK
                  }
                />
              </div>
            </div>
          </div>

          <div className="mt-2 flex gap-4 px-1 text-[9px] font-bold text-zinc-400">
            <span>
              ● Jugó
            </span>

            <span>
              ○ No jugó
            </span>
          </div>
        </section>

        {/* DESGLOSE */}
        <section className="mt-7">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Rendimiento
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                Desglose del XI
              </h2>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">
              {result.players.length} jugadores
            </span>
          </div>

          <div className="mt-3 overflow-hidden rounded-[1.3rem] bg-white shadow-sm ring-1 ring-black/5">
            {[...result.players]
              .sort(
                (
                  a,
                  b,
                ) =>
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
      </div>
    </main>
  );
}

function LineupSelector({
  members,
  leagueId,
  matchId,
  currentUserId,
  selectedUserId,
}: {
  members: Awaited<
    ReturnType<
      typeof getFantasyLeagueMembers
    >
  >;

  leagueId: string;
  matchId: string;
  currentUserId: string;
  selectedUserId: string;
}) {
  return (
    <section className="mt-4">
      <div className="flex items-center justify-between px-1">
        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
          Alineaciones
        </p>

        <span className="text-[9px] font-bold text-zinc-400">
          {members.length} jugadores
        </span>
      </div>

      <div className="-mx-4 mt-2 overflow-x-auto px-4 pb-1">
        <div className="flex w-max gap-2">
          {members.map(
            (member) => {
              const memberName =
                member.profile
                  ?.display_name ??
                "Jugador";

              const active =
                member.user_id ===
                selectedUserId;

              const mine =
                member.user_id ===
                currentUserId;

              const href =
                mine
                  ? `/fantasy/leagues/${leagueId}/matches/${matchId}`
                  : `/fantasy/leagues/${leagueId}/matches/${matchId}?user=${encodeURIComponent(
                      member.user_id,
                    )}`;

              return (
                <Link
                  key={
                    member.user_id
                  }
                  href={href}
                  className={`flex h-10 items-center gap-2 rounded-xl px-3 transition active:scale-[0.98] ${
                    active
                      ? "bg-[#0f3d2e] text-white shadow-sm"
                      : "bg-white text-zinc-950 ring-1 ring-black/5"
                  }`}
                >
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                      active
                        ? "bg-white/15 text-white"
                        : "bg-[#e8f2ed] text-[#0f3d2e]"
                    }`}
                  >
                    {memberName
                      .charAt(
                        0,
                      )
                      .toUpperCase()}
                  </div>

                  <p className="max-w-[90px] truncate text-[11px] font-black">
                    {mine
                      ? "Mi XI"
                      : memberName}
                  </p>
                </Link>
              );
            },
          )}
        </div>
      </div>
    </section>
  );
}

function ResultFieldRow({
  players,
}: {
  players: FantasyPlayer[];
}) {
  if (
    players.length ===
    0
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
        (
          player,
        ) => {
          const played =
            player.minutes_played >
            0;

          return (
            <div
              key={
                player.player_id
              }
              className={`flex w-full max-w-[92px] flex-col items-center text-center ${
                !played
                  ? "opacity-70"
                  : ""
              }`}
            >
              <div className="relative">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full font-black shadow-md ring-2 ${
                    played
                      ? "bg-white text-[#0f5e3d] ring-white/30"
                      : "bg-zinc-200 text-zinc-500 ring-white/20"
                  }`}
                >
                  {player.shirt_number ??
                    "—"}
                </div>

                <div
                  className={`absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[9px] font-black shadow ${
                    player.points >
                    0
                      ? "bg-zinc-950 text-white"
                      : "bg-zinc-600 text-white"
                  }`}
                >
                  {player.points}
                </div>
              </div>

              <span className="mt-1 max-w-full truncate rounded-md bg-zinc-950/85 px-2 py-1 text-[9px] font-black text-white">
                {player.player_name}
              </span>

              {played ? (
                <span className="mt-1 text-[8px] font-bold text-white/75">
                  {player.minutes_played} min
                </span>
              ) : (
                <span className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black uppercase text-white">
                  No jugó
                </span>
              )}
            </div>
          );
        },
      )}
    </div>
  );
}

function PlayerPointsRow({
  player,
  position,
}: {
  player: FantasyPlayer;
  position?: number;
}) {
  const played =
    player.minutes_played >
    0;

  return (
    <div
      className={`flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 ${
        !played
          ? "bg-zinc-50/70"
          : ""
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        {position ? (
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
              position === 1
                ? "bg-[#0f3d2e] text-white"
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {position}
          </span>
        ) : (
          <span className="flex h-9 min-w-9 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] font-black text-[#0f3d2e]">
            {player.shirt_number ??
              "—"}
          </span>
        )}

        <div className="min-w-0">
          <p className="truncate text-xs font-black text-zinc-950">
            {player.player_name}
          </p>

          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] font-semibold text-zinc-400">
            <span>
              {player.position ??
                "—"}
            </span>

            <span>
              •
            </span>

            {played ? (
              <span>
                {player.minutes_played} min
              </span>
            ) : (
              <span className="font-black uppercase text-zinc-500">
                No jugó
              </span>
            )}

            {player.final_rating !==
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
        <p
          className={`text-lg font-black ${
            player.points >
            0
              ? "text-[#0f3d2e]"
              : player.points <
                  0
                ? "text-red-600"
                : "text-zinc-400"
          }`}
        >
          {player.points}

          <span className="ml-1 text-[8px] font-black uppercase text-zinc-400">
            pts
          </span>
        </p>
      </div>
    </div>
  );
}