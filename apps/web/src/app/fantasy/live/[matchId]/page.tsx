import Link from "next/link";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth";
import { getFantasyLeagueById, getUserFantasyLeagues } from "@/data/fantasy-leagues";
import { getFantasyLineup, getFantasyLineupPlayers } from "@/data/fantasy-lineups";
import { getMatchById } from "@/data/matches";
import { getMatchPlayers } from "@/data/match-players";
import { getMatchEvents } from "@/data/match-events";
import { getTeams } from "@/data/teams";
import {
  isFantasyMatchFollowable,
  isFantasyMatchPlaying,
  getFantasyLivePhaseLabel,
} from "@/lib/fantasy-live-match";

import MiniPitch, { type MiniPitchPlayer } from "../mini-pitch";
import RefreshLiveMatch from "../refresh-live-match";

function fullName(first: string, last: string | null): string {
  return [first, last].filter(Boolean).join(" ");
}

export default async function FantasyLiveMatchPage({
  params,
  searchParams,
}: {
  params: Promise<{ matchId: string }>;
  searchParams: Promise<{ league?: string | string[] }>;
}) {
  const user = await requireUser();
  const { matchId } = await params;
  const query = await searchParams;

  // No aceptamos el ID de liga ni el user_id como prueba de pertenencia.
  const leagueId = typeof query.league === "string" ? query.league : null;
  if (!leagueId) {
    notFound();
  }

  const memberships = await getUserFantasyLeagues(user.id);
  if (!memberships.some((member) => member.league_id === leagueId)) {
    notFound();
  }

  const [league, match] = await Promise.all([
    getFantasyLeagueById(leagueId),
    getMatchById(matchId),
  ]);

  if (
    !league ||
    !match ||
    (match.home_team_id !== league.team_id && match.away_team_id !== league.team_id) ||
    !isFantasyMatchFollowable(match)
  ) {
    notFound();
  }

  const [squad, teams, events, lineup] = await Promise.all([
    getMatchPlayers(matchId),
    getTeams(),
    getMatchEvents(matchId),
    getFantasyLineup({ leagueId, userId: user.id, matchId }),
  ]);

  const selected = lineup ? await getFantasyLineupPlayers(lineup.id) : [];
  const playing = isFantasyMatchPlaying(match.live_phase);
  const byPlayerId = new Map(squad.map((player) => [player.player_id, player]));
  const clubEntries = squad.filter((entry) => entry.team_id === league.team_id);
  const realXI: MiniPitchPlayer[] = clubEntries
    .filter((entry) => entry.starter)
    .map((entry) => ({
      id: entry.player_id,
      name: entry.player
        ? fullName(entry.player.first_name, entry.player.last_name)
        : "Jugador",
      position: entry.player?.position ?? "",
      shirtNumber: entry.player?.shirt_number ?? null,
      isPlaying: entry.on_field,
    }));

  const fantasyXI: MiniPitchPlayer[] = selected.map((entry) => ({
    id: entry.player_id,
    name: entry.player
      ? fullName(entry.player.first_name, entry.player.last_name)
      : "Jugador",
    position: entry.player?.position ?? "",
    shirtNumber: entry.player?.shirt_number ?? null,
    isPlaying: byPlayerId.get(entry.player_id)?.on_field ?? false,
    captain: entry.player_id === lineup?.captain_player_id,
  }));

  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const homeTeam = teamNames.get(match.home_team_id) ?? "Equipo local";
  const awayTeam = teamNames.get(match.away_team_id) ?? "Equipo visitante";

  // El Match Center contabiliza los eventos de gol (también los autogoles).
  // En un partido terminado prevalece el marcador final confirmado.
  const recordedGoals = events.filter((event) => event.event_type === "goal");
  const liveHomeScore = recordedGoals.filter(
    (event) => event.scoring_team_id === match.home_team_id,
  ).length;
  const liveAwayScore = recordedGoals.filter(
    (event) => event.scoring_team_id === match.away_team_id,
  ).length;
  const homeScore = match.status === "finished"
    ? (match.home_score ?? liveHomeScore)
    : liveHomeScore;
  const awayScore = match.status === "finished"
    ? (match.away_score ?? liveAwayScore)
    : liveAwayScore;

  return (
    <main className="app-screen bg-[#f2f4f2]">
      <div className="mx-auto max-w-xl">
        <header className="relative overflow-hidden rounded-b-[1.75rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.55rem)] text-white shadow-lg">
          <div className="absolute -right-12 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />
          <div className="relative z-10">
            <Link
              href={"/fantasy?league=" + leagueId}
              className="inline-flex min-h-10 items-center text-xs font-bold text-white/75 focus-visible:outline-2 focus-visible:outline-white"
            >
              ← Volver a Fantasy
            </Link>
            <div className="mt-1 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[9px] font-black uppercase tracking-[0.18em] text-white/55">
                  {league.name}
                </p>
                <h1 className="mt-1 text-xl font-black tracking-tight">
                  Sigue el partido
                </h1>
              </div>
              <span className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-[10px] font-black">
                {playing ? "● EN DIRECTO" : "FINALIZADO"}
              </span>
            </div>
          </div>
        </header>

        <div className="space-y-4 px-3 pb-8 pt-3">
          <section className="overflow-hidden rounded-[1.5rem] bg-white px-3 py-4 shadow-sm ring-1 ring-black/5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
              <p className="text-right text-xs font-black leading-4 text-zinc-900">
                {homeTeam}
              </p>
              <div className="flex items-center gap-2 rounded-xl bg-[#0f3d2e] px-3 py-2 text-2xl font-black tabular-nums text-white">
                <span>{homeScore}</span>
                <span className="text-white/45">–</span>
                <span>{awayScore}</span>
              </div>
              <p className="text-left text-xs font-black leading-4 text-zinc-900">
                {awayTeam}
              </p>
            </div>
            <div className="mt-3 flex items-center justify-center gap-3 border-t border-zinc-100 pt-2.5">
              <span className="text-[11px] font-black text-[#0f3d2e]">
                {getFantasyLivePhaseLabel(match.live_phase)}
              </span>
              <RefreshLiveMatch />
            </div>
          </section>

          <section aria-labelledby="live-pitches-title">
            <div className="mb-2 px-1">
              <h2 id="live-pitches-title" className="text-base font-black text-zinc-950">
                Las dos alineaciones
              </h2>
              <p className="mt-0.5 text-[11px] text-zinc-500">
                El XI real de Directiva y tu XI Fantasy, en el mismo partido.
              </p>
            </div>

            <div className="grid grid-cols-2 items-start gap-2">
              <MiniPitch title="XI real" players={realXI} showLiveState={playing} />
              <MiniPitch title="Mi XI Fantasy" players={fantasyXI} showLiveState={playing} />
            </div>

            <div className="mt-2 rounded-xl bg-white px-3 py-2 text-[10px] leading-4 text-zinc-600 ring-1 ring-black/5">
              {playing ? (
                <>
                  <span className="font-bold text-[#0f3d2e]">Verde:</span> jugador en campo ·
                  <span className="font-bold text-zinc-600"> Gris:</span> fuera del campo ·{" "}
                </>
              ) : null}
              <span className="font-black text-amber-700">C:</span> capitán Fantasy.
              {realXI.length === 0 && (
                <p className="mt-1 text-amber-700">
                  Directiva todavía no ha definido el XI titular de este equipo.
                </p>
              )}
              {fantasyXI.length === 0 && (
                <p className="mt-1 text-amber-700">
                  No guardaste un XI Fantasy para este partido.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-[1.4rem] bg-[#e8f2ed] p-4">
            <p className="text-sm font-black text-[#0f3d2e]">
              Siguiente bloque: puntos y timeline en directo
            </p>
            <p className="mt-1 text-xs leading-5 text-[#557368]">
              Esta primera versión muestra alineaciones reales y el marcador. Los
              puntos provisionales por jugador y el timeline se incorporarán a
              continuación, sin inventar puntuaciones ni alterar el cálculo Fantasy.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
