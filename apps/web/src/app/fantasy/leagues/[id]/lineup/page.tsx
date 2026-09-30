import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
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
    await getFantasyLeagueById(leagueId);

  if (!league) {
    notFound();
  }

  const members =
    await getFantasyLeagueMembers(leagueId);

  const isMember = members.some(
    (member) => member.user_id === user.id,
  );

  if (!isMember) {
    return (
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
        <p className="rounded-2xl bg-red-50 p-5 text-red-700">
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
          (match.home_team_id ===
            league.team_id ||
            match.away_team_id ===
              league.team_id),
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
      <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
        <Link
          href={`/fantasy/leagues/${leagueId}`}
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver a la liga
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          Mi XI
        </h1>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
          <p className="font-semibold">
            No hay próximo partido disponible.
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            Debe existir un partido futuro con estado
            «Programado» para el equipo de esta liga.
          </p>
        </section>
      </main>
    );
  }

  const players =
    await getPlayersByTeam(
      league.team_id,
    );

  const activePlayers =
    players.filter(
      (player) => player.active,
    );

  const existingLineup =
    await getFantasyLineup({
      leagueId,
      userId: user.id,
      matchId: nextMatch.id,
    });

  let selectedPlayerIds: string[] =
    [];

  if (existingLineup) {
    const lineupPlayers =
      await getFantasyLineupPlayers(
        existingLineup.id,
      );

    selectedPlayerIds =
      lineupPlayers.map(
        (entry) => entry.player_id,
      );
  }

  const teamNames = new Map(
    teams.map((team) => [
      team.id,
      team.name,
    ]),
  );

  const homeTeam =
    teamNames.get(
      nextMatch.home_team_id,
    ) ?? "Equipo local";

  const awayTeam =
    teamNames.get(
      nextMatch.away_team_id,
    ) ?? "Equipo visitante";

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
          Mi XI
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Prepara tu alineación para el próximo partido.
        </p>
      </header>

      <section className="mt-6 rounded-2xl bg-white p-5 text-center shadow-sm ring-1 ring-zinc-200">
        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
          Próximo partido
        </p>

        <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
          <p className="font-bold text-zinc-950">
            {homeTeam}
          </p>

          <span className="text-sm font-bold text-zinc-400">
            VS
          </span>

          <p className="font-bold text-zinc-950">
            {awayTeam}
          </p>
        </div>

        <p className="mt-4 text-sm font-semibold text-zinc-600">
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
              nextMatch.match_date,
            ),
          )}
        </p>
      </section>

      <LineupForm
        leagueId={leagueId}
        matchId={nextMatch.id}
        players={activePlayers.map(
          (player) => ({
            id: player.id,
            firstName:
              player.first_name,
            lastName:
              player.last_name,
            shirtNumber:
              player.shirt_number,
            position:
              player.position,
          }),
        )}
        initialSelectedIds={
          selectedPlayerIds
        }
        locked={
          existingLineup !== null &&
          existingLineup.locked_at !==
            null
        }
      />
    </main>
  );
}