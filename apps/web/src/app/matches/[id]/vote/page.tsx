import { notFound } from "next/navigation";
import { parseMatchId } from "@regional-fantasy/shared";
import { getMatchById } from "@/data/matches";
import { getMatchPlayers } from "@/data/match-players";
import { getTeams } from "@/data/teams";
import { isDevelopmentVotingEnabled } from "@/lib/development-voting";
import { submitVotesAction } from "./actions";
import { VoteForm } from "./vote-form";

export default async function VotePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isDevelopmentVotingEnabled()) return <main className="p-8"><h1>Votación no disponible</h1><p>La identidad temporal de votante solo está habilitada en desarrollo.</p></main>;
  const { id } = await params;
  let matchId: string;
  try { matchId = parseMatchId(id); } catch { notFound(); }
  let match;
  try { match = await getMatchById(matchId); }
  catch { return <main className="p-8"><p role="alert">No se pudo cargar el partido. Inténtalo de nuevo.</p></main>; }
  if (!match) notFound();
  let loaded;
  try { loaded = await Promise.all([getTeams(), match.status === "voting" ? getMatchPlayers(matchId) : Promise.resolve([])]); }
  catch { return <main className="p-8"><p role="alert">No se pudo cargar la convocatoria o los equipos. Inténtalo de nuevo.</p></main>; }
  const [teams, squad] = loaded;
  const names = new Map(teams.map(team => [team.id, team.name]));
  const date = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(match.match_date));
  return <main className="mx-auto max-w-3xl p-8">
    <h1 className="text-2xl font-semibold">Votación del partido</h1>
    <p className="mt-4">{names.get(match.home_team_id) ?? "Equipo local"} — {names.get(match.away_team_id) ?? "Equipo visitante"}</p>
    <p><time dateTime={match.match_date}>{date} UTC</time></p>
    <p>Resultado: {match.home_score === null && match.away_score === null ? "Sin resultado" : `${match.home_score ?? "—"} - ${match.away_score ?? "—"}`}</p>
    {match.status !== "voting" ? <p className="mt-4">La votación de este partido no está abierta.</p> : squad.length === 0 ? <p className="mt-4">No hay jugadores en la convocatoria para votar.</p> : (
      <VoteForm action={submitVotesAction.bind(null, match.id)} players={squad.map(entry => ({
        id: entry.player_id,
        name: entry.player ? `${entry.player.first_name} ${entry.player.last_name ?? ""}`.trim() : "Jugador no disponible",
        shirtNumber: entry.player?.shirt_number ?? null,
        position: entry.player?.position ?? "Sin posición",
        team: entry.team?.name ?? "Equipo no disponible",
      }))} />
    )}
  </main>;
}
