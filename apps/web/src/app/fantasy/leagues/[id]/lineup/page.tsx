import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";

import type {
  PlayerPosition,
} from "@regional-fantasy/shared";

import {
  getFantasyLeagueById,
  getFantasyLeagueMembers,
} from "@/data/fantasy-leagues";

import {
  getMatches,
} from "@/data/matches";

import {
  getPlayersByTeam,
} from "@/data/players";

import {
  getTeams,
} from "@/data/teams";

import {
  getFantasyLineup,
  getFantasyLineupPlayers,
} from "@/data/fantasy-lineups";

import LineupForm from "./lineup-form";

export default async function FantasyLineupPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const user =
    await requireUser();

  const {
    id: leagueId,
  } =
    await params;

  const league =
    await getFantasyLeagueById(
      leagueId,
    );

  if (!league) {
    notFound();
  }

  const members =
    await getFantasyLeagueMembers(
      leagueId,
    );

  const isMember =
    members.some(
      (member) =>
        member.user_id ===
        user.id,
    );

  if (!isMember) {
    return (
      <main className="mx-auto min-h-screen max-w-xl px-4 py-6">
        <p className="rounded-[1.5rem] bg-red-50 p-5 font-medium text-red-700">
          No tienes acceso a esta liga.
        </p>
      </main>
    );
  }

  const [
    matches,
    teams,
  ] =
    await Promise.all([
      getMatches(),
      getTeams(),
    ]);

  const now =
    Date.now();

  const nextMatch =
    matches
      .filter(
        (match) =>
          match.status ===
            "scheduled" &&
          new Date(
            match.match_date,
          ).getTime() >
            now &&
          (
            match.home_team_id ===
              league.team_id ||
            match.away_team_id ===
              league.team_id
          ),
      )
      .sort(
        (a, b) =>
          new Date(
            a.match_date,
          ).getTime() -
          new Date(
            b.match_date,
          ).getTime(),
      )[0] ??
    null;

  if (!nextMatch) {
    return (
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
        <header className="relative overflow-hidden rounded-b-[1.6rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.45rem)] text-white shadow-lg">
          <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

          <div className="relative z-10">
            <Link
              href={`/fantasy/leagues/${leagueId}`}
              className="text-[11px] font-bold text-white/65"
            >
              ← Volver a la liga
            </Link>

            <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
              {league.name}
            </p>

            <h1 className="mt-0.5 text-2xl font-black tracking-tight">
              Mi XI
            </h1>
          </div>
        </header>

        <div className="px-4">
          <section className="mt-3 rounded-[1.3rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg">
              ⚽
            </div>

            <p className="mt-3 font-black text-zinc-950">
              No hay próximo partido
            </p>

            <p className="mt-1.5 text-sm leading-6 text-zinc-500">
              Cuando haya un partido programado para este equipo podrás preparar tu XI.
            </p>
          </section>
        </div>
      </main>
    );
  }

  const matchTime =
    new Date(
      nextMatch.match_date,
    ).getTime();

  const lineupLockTime =
    matchTime -
    60 *
      60 *
      1000;

  const lockedByTime =
    now >=
    lineupLockTime;

  const players =
    await getPlayersByTeam(
      league.team_id,
    );

  const activePlayers =
    players.filter(
      (player) =>
        player.active,
    );

  const existingLineup =
    await getFantasyLineup({
      leagueId,

      userId:
        user.id,

      matchId:
        nextMatch.id,
    });

  let selectedPlayerIds:
    string[] = [];

  if (existingLineup) {
    const lineupPlayers =
      await getFantasyLineupPlayers(
        existingLineup.id,
      );

    selectedPlayerIds =
      lineupPlayers.map(
        (entry) =>
          entry.player_id,
      );
  }

  const manuallyLocked =
    existingLineup !==
      null &&
    existingLineup.locked_at !==
      null;

  const locked =
    lockedByTime ||
    manuallyLocked;

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
      nextMatch.home_team_id,
    ) ??
    "Equipo local";

  const awayTeam =
    teamNames.get(
      nextMatch.away_team_id,
    ) ??
    "Equipo visitante";

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
        nextMatch.match_date,
      ),
    );

  const lockDateLabel =
    new Intl.DateTimeFormat(
      "es-ES",
      {
        hour:
          "2-digit",

        minute:
          "2-digit",

        timeZone:
          "Europe/Madrid",
      },
    ).format(
      new Date(
        lineupLockTime,
      ),
    );

  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
      {/* CABECERA MÁS COMPACTA */}
      <header className="relative overflow-hidden rounded-b-[1.6rem] bg-[#0f3d2e] px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.45rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="absolute -left-14 bottom-[-64px] h-32 w-32 rounded-full border-[20px] border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between gap-3">
            <Link
              href={`/fantasy/leagues/${leagueId}`}
              className="text-[11px] font-bold text-white/65"
            >
              ← Liga
            </Link>

            <div
              className={`rounded-[0.8rem] px-2.5 py-1 text-right ${
                locked
                  ? "bg-red-500/15"
                  : "bg-white/10"
              }`}
            >
              <p className="text-[7px] font-black uppercase tracking-wide text-white/45">
                Cierre
              </p>

              <p className="text-xs font-black">
                {lockDateLabel}
              </p>
            </div>
          </div>

          <div className="mt-2.5 flex items-end justify-between gap-3">
            <div>
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
                {league.name}
              </p>

              <h1 className="mt-0.5 text-[1.8rem] font-black leading-none tracking-tight">
                Mi XI
              </h1>

              <p className="mt-1 text-[11px] text-white/55">
                Alineación Fantasy
              </p>
            </div>

            <span
              className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${
                locked
                  ? "bg-red-500/15 text-red-200"
                  : "bg-white/10 text-white/65"
              }`}
            >
              {locked
                ? "Cerrada"
                : "Editable"}
            </span>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* PARTIDO */}
        <section className="mt-2.5">
          <div className="overflow-hidden rounded-[1.15rem] bg-white shadow-sm ring-1 ring-black/5">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2.5">
              <p className="text-right text-[10px] font-black leading-3.5 text-zinc-950">
                {homeTeam}
              </p>

              <div className="flex h-8 w-8 items-center justify-center rounded-[0.7rem] bg-zinc-950 text-[8px] font-black text-white">
                VS
              </div>

              <p className="text-left text-[10px] font-black leading-3.5 text-zinc-950">
                {awayTeam}
              </p>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50 px-3 py-1.5 text-center">
              <p className="text-[9px] font-bold capitalize text-zinc-500">
                {matchDateLabel}
              </p>
            </div>
          </div>
        </section>

        {/* ESTADO */}
        <section
          className={`mt-2 flex items-center gap-2.5 rounded-[1rem] px-3 py-2 ${
            locked
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] ${
              locked
                ? "bg-red-600 text-white"
                : "bg-[#0f3d2e] text-white"
            }`}
          >
            {locked
              ? "🔒"
              : "✓"}
          </div>

          <div className="min-w-0">
            <p
              className={`text-[11px] font-black ${
                locked
                  ? "text-red-800"
                  : "text-[#0b2f23]"
              }`}
            >
              {locked
                ? "Alineación cerrada"
                : "Alineación editable"}
            </p>

            <p
              className={`truncate text-[9px] ${
                locked
                  ? "text-red-600"
                  : "text-[#557368]"
              }`}
            >
              {locked
                ? "Ya no se pueden realizar cambios."
                : `Cambios hasta las ${lockDateLabel}.`}
            </p>
          </div>
        </section>

        <LineupForm
          leagueId={
            leagueId
          }
          matchId={
            nextMatch.id
          }
          players={activePlayers.map(
            (player) => ({
              id:
                player.id,

              firstName:
                player.first_name,

              lastName:
                player.last_name,

              shirtNumber:
                player.shirt_number,

              position:
                player.position as PlayerPosition,
            }),
          )}
          initialSelectedIds={
            selectedPlayerIds
          }
          locked={
            locked
          }
        />
      </div>
    </main>
  );
}