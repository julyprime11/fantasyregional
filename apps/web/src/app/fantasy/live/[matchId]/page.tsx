import Link from "next/link";
import { notFound } from "next/navigation";

import { getFantasyCaptainBonus, getFantasyMatchScoringTeamId, FANTASY_EXTRA_STATS } from "@regional-fantasy/shared";

import { requireUser } from "@/lib/auth";
import { getFantasyLeagueById, getUserFantasyLeagues } from "@/data/fantasy-leagues";
import { getFantasyLineup, getFantasyLineupPlayers } from "@/data/fantasy-lineups";
import { getMatchById } from "@/data/matches";
import { getMatchPlayers } from "@/data/match-players";
import { getMatchEvents } from "@/data/match-events";
import { calculateFantasyLivePoints } from "@/data/fantasy-live-points";
import { getTeams } from "@/data/teams";
import {
  isFantasyMatchFollowable,
  isFantasyMatchPlaying,
  getFantasyLivePhaseLabel,
} from "@/lib/fantasy-live-match";

import MiniPitch, { type MiniPitchPlayer } from "../mini-pitch";
import RefreshLiveMatch from "../refresh-live-match";
import LiveMatchTimeline from "../live-timeline";
import FantasyLiveClock from "../live-match-clock";

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

  // Algunas estadísticas V3 se guardaron antes de disponer de eventos.
  // Las mostramos sin inventar un minuto ni duplicar las acciones nuevas.
  const historicalStats = squad.flatMap((entry) =>
    FANTASY_EXTRA_STATS.filter((stat) => stat.field !== "own_goals").flatMap((stat) => {
      const alreadyRecorded = events.filter(
        (event) => event.player_id === entry.player_id && event.event_type === stat.field,
      ).length;
      const remaining = Math.max(0, (entry[stat.field] ?? 0) - alreadyRecorded);
      return remaining > 0
        ? [{ playerId: entry.player_id, field: stat.field, count: remaining }]
        : [];
    }),
  );

  const selected = lineup ? await getFantasyLineupPlayers(lineup.id) : [];
  const playing = isFantasyMatchPlaying(match.live_phase);
  const byPlayerId = new Map(squad.map((player) => [player.player_id, player]));
  const provisional = calculateFantasyLivePoints({
    match,
    squad,
    events,
    now: Date.now(),
  });

  function playerPoints(playerId: string): number | null {
    const score = provisional.pointsByPlayerId.get(playerId);
    // Los no convocados no han participado y tienen cero puntos.
    // Si hay convocatoria pero no posición válida, no inventamos la nota.
    return score ? score.points : byPlayerId.has(playerId) ? null : 0;
  }
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
      points: playerPoints(entry.player_id),
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
    points: playerPoints(entry.player_id),
  }));

  const realTotal = realXI.reduce((total, player) => total + (player.points ?? 0), 0);
  const fantasyBaseTotal = fantasyXI.reduce((total, player) => total + (player.points ?? 0), 0);
  const captainBonus = getFantasyCaptainBonus(
    selected.flatMap((entry) => {
      const result = provisional.pointsByPlayerId.get(entry.player_id);
      return result ? [result] : [];
    }),
    lineup?.captain_player_id ?? null,
  );
  const fantasyTotal = fantasyBaseTotal + captainBonus;

  const teamNames = new Map(teams.map((team) => [team.id, team.name]));
  const homeTeam = teamNames.get(match.home_team_id) ?? "Equipo local";
  const awayTeam = teamNames.get(match.away_team_id) ?? "Equipo visitante";

  // En goles antiguos de jugador, scoring_team_id puede ser null.
  // Se usa el mismo criterio que el calculo Fantasy global, incluidos autogoles.
  // En un partido terminado prevalece el marcador final confirmado.
  const teamByPlayer = new Map(squad.map((entry) => [entry.player_id, entry.team_id]));
  const goalTeams = events
    .filter((event) => event.event_type === "goal")
    .map((event) =>
      getFantasyMatchScoringTeamId(
        event,
        teamByPlayer,
        match.home_team_id,
        match.away_team_id,
      ),
    );
  const liveHomeScore = goalTeams.filter((teamId) => teamId === match.home_team_id).length;
  const liveAwayScore = goalTeams.filter((teamId) => teamId === match.away_team_id).length;
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
            <div className="mt-3 flex flex-wrap items-center justify-between gap-x-2 gap-y-2 border-t border-zinc-100 pt-2.5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-[11px] font-black text-[#0f3d2e]">
                  {getFantasyLivePhaseLabel(match.live_phase)}
                </span>
                <FantasyLiveClock
                  phase={match.live_phase}
                  clockSeconds={match.live_clock_seconds ?? 0}
                  clockStartedAt={match.live_clock_started_at}
                />
              </div>
              <RefreshLiveMatch matchId={matchId} />
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
              <MiniPitch
                variant="real"
                title="XI real"
                players={realXI}
                showLiveState={playing}
                totalPoints={realTotal}
              />
              <MiniPitch
                variant="fantasy"
                title="Mi XI Fantasy"
                players={fantasyXI}
                showLiveState={playing}
                totalPoints={fantasyTotal}
              />
            </div>

            <div className="mt-2 rounded-xl bg-white px-3 py-2 text-[10px] leading-4 text-zinc-600 ring-1 ring-black/5">
              {playing ? (
                <>
                  <span className="font-bold text-[#0f3d2e]">Verde:</span> jugador en campo ·
                  <span className="font-bold text-zinc-600"> Gris:</span> fuera del campo ·{" "}
                </>
              ) : null}
              <span className="font-black text-amber-700">C:</span> capitán Fantasy (sus puntos cuentan ×2 en este campo).
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

            <div className="mt-3 rounded-[1.2rem] bg-white p-3 shadow-sm ring-1 ring-black/5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <p className="text-[9px] font-black uppercase tracking-wide text-zinc-500">
                    Puntos provisionales · Mi XI
                  </p>
                  <p className="mt-1 text-2xl font-black tabular-nums text-[#0f3d2e]">
                    {fantasyTotal} <span className="text-xs">pts</span>
                  </p>
                </div>
                <div className="text-right text-[10px] leading-4 text-zinc-500">
                  <p>Jugadores: <strong className="text-zinc-800">{fantasyBaseTotal}</strong></p>
                  <p>Capitán: <strong className="text-zinc-800">{captainBonus > 0 ? `+${captainBonus}` : captainBonus}</strong></p>
                </div>
              </div>

              <details className="mt-2 border-t border-zinc-100 pt-2">
                <summary className="cursor-pointer py-1 text-[11px] font-black text-[#0f3d2e]">
                  Ver desglose provisional por jugador
                </summary>
                <div className="mt-2 space-y-1.5">
                  {fantasyXI.map((player) => {
                    const result = provisional.pointsByPlayerId.get(player.id);
                    return (
                      <div key={player.id} className="rounded-lg bg-zinc-50 px-2.5 py-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="min-w-0 truncate text-[11px] font-bold text-zinc-800">
                            {player.name} {player.captain ? "ⓒ" : ""}
                          </span>
                          <span className="shrink-0 text-[11px] font-black tabular-nums text-[#0f3d2e]">
                            {player.points === null ? "—" : player.points} pts
                          </span>
                        </div>
                        {result ? (
                          <p className="mt-1 text-[10px] leading-4 text-zinc-500">
                            Minutos {result.breakdown.minutes} · Goles {result.breakdown.goals} ·
                            Asistencias {result.breakdown.assists} ·
                            Tarjetas {result.breakdown.cards} ·
                            Extras V3 {result.breakdown.extra_stats} ·
                            Encajados {result.breakdown.goals_conceded}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[10px] text-zinc-500">
                            {player.points === null ? "Sin posición válida para calcular" : "Aún no ha participado"}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </section>

          <LiveMatchTimeline
            events={events}
            historicalStats={historicalStats}
            playerNames={Object.fromEntries(
              squad
                .filter((entry) => entry.player !== null)
                .map((entry) => [
                  entry.player_id,
                  fullName(entry.player!.first_name, entry.player!.last_name),
                ]),
            )}
            teamNames={Object.fromEntries(teamNames)}
          />

          <section className="rounded-[1.4rem] bg-[#e8f2ed] p-4">
            <p className="text-sm font-black text-[#0f3d2e]">
              Puntuación en curso
            </p>
            <p className="mt-1 text-xs leading-5 text-[#557368]">
              Incluye estadísticas registradas por Directiva, minutos transcurridos
              y penalizaciones reconstruidas del partido. No anticipa votos,
              MVP ni bonificación por portería a cero. Los puntos pueden cambiar
              hasta que finalice el encuentro y se cierren las valoraciones.
            </p>
            {provisional.goalsConcededPending && (
              <p className="mt-2 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-bold leading-4 text-amber-900">
                Hay goles encajados pendientes de comprobar en la cronología;
                todavía no se aplica su penalización Fantasy.
              </p>
            )}
            <p className="mt-2 text-[10px] text-[#557368]">
              El marcador, las estadísticas, las alineaciones y la cronología se
              sincronizan automáticamente con las anotaciones de Directiva. Si se
              interrumpe la conexión, se actualizan al recuperarla o al volver a la pantalla.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
