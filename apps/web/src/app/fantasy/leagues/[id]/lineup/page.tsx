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

import { getMatches } from "@/data/matches";
import { getPlayersByTeam } from "@/data/players";
import { getTeams } from "@/data/teams";

import {
  getFantasyLineup,
  getFantasyLineupPlayers,
} from "@/data/fantasy-lineups";

import LineupForm from "./lineup-form";

export default async function FantasyLineupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id: leagueId } = await params;

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

  const [matches, teams] =
    await Promise.all([
      getMatches(),
      getTeams(),
    ]);

  const now = Date.now();

  const nextMatch =
    matches
      .filter(
        (match) =>
          match.status === "scheduled" &&
          new Date(
            match.match_date,
          ).getTime() > now &&
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
      )[0] ?? null;

  if (!nextMatch) {
    return (
      <main className="mx-auto min-h-screen max-w-xl">
        <header className="rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-7 pt-5 text-white">
          <Link
            href={`/fantasy/leagues/${leagueId}`}
            className="text-sm font-bold text-white/70"
          >
            ← Volver a la liga
          </Link>

          <p className="mt-7 text-[10px] font-black uppercase tracking-[0.2em] text-white/50">
            {league.name}
          </p>

          <h1 className="mt-2 text-3xl font-black">
            Mi XI
          </h1>
        </header>

        <div className="px-4">
          <section className="mt-6 rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f2ed] text-xl">
              ⚽
            </div>

            <p className="mt-4 font-black text-zinc-950">
              No hay próximo partido
            </p>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
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
    60 * 60 * 1000;

  const lockedByTime =
    now >= lineupLockTime;

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
      userId: user.id,
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
    existingLineup !== null &&
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
        nextMatch.match_date,
      ),
    );

  const lockDateLabel =
    new Intl.DateTimeFormat(
      "es-ES",
      {
        hour: "2-digit",
        minute: "2-digit",
        timeZone:
          "Europe/Madrid",
      },
    ).format(
      new Date(
        lineupLockTime,
      ),
    );

  return (
    <main className="mx-auto min-h-screen max-w-xl">
      {/* CABECERA */}
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

          <div className="mt-2 flex items-end justify-between gap-3">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Mi XI
              </h1>

              <p className="mt-1 text-sm text-white/60">
                Alineación Fantasy
              </p>
            </div>

            <div className="rounded-2xl bg-white/10 px-4 py-2 text-center">
              <p className="text-[9px] font-black uppercase tracking-wide text-white/50">
                Cierre
              </p>

              <p className="mt-0.5 text-lg font-black">
                {lockDateLabel}
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-8">
        {/* PARTIDO */}
        <section className="relative z-10 -mt-1 pt-5">
          <div className="overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
            <div className="px-5 py-4 text-center">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                Próximo partido
              </p>

              <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <p className="text-sm font-black leading-5 text-zinc-950">
                  {homeTeam}
                </p>

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-[10px] font-black text-white">
                  VS
                </div>

                <p className="text-sm font-black leading-5 text-zinc-950">
                  {awayTeam}
                </p>
              </div>
            </div>

            <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-center">
              <p className="text-xs font-bold capitalize text-zinc-500">
                {matchDateLabel}
              </p>
            </div>
          </div>
        </section>

        {/* ESTADO */}
        <section
          className={`mt-3 flex items-start gap-3 rounded-[1.3rem] p-4 ${
            locked
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <div
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm ${
              locked
                ? "bg-red-600 text-white"
                : "bg-[#0f3d2e] text-white"
            }`}
          >
            {locked
              ? "🔒"
              : "✓"}
          </div>

          <div>
            <p
              className={`text-sm font-black ${
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
              className={`mt-1 text-xs leading-5 ${
                locked
                  ? "text-red-600"
                  : "text-[#557368]"
              }`}
            >
              {locked
                ? "El plazo para modificar tu XI ya ha terminado."
                : `Puedes realizar cambios hasta las ${lockDateLabel}.`}
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
          players={
            activePlayers.map(
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
            )
          }
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