import Link from "next/link";
import { notFound } from "next/navigation";
import { parseMatchId } from "@regional-fantasy/shared";
import { getMatchById } from "@/data/matches";
import { getTeams } from "@/data/teams";
import { getCompetitions } from "@/data/competitions";
import { getMatchPlayers, getEligibleSquadPlayers } from "@/data/match-players";
import { addMatchPlayerAction, updateMatchPlayerAction, removeMatchPlayerAction } from "../../actions";
import { CreateForm } from "../../create-form";
import { matchStatusLabels } from "../fields";
import { squadStatsFields } from "./squad-fields";
import { isDevelopmentVotingEnabled } from "@/lib/development-voting";

export default async function ManageMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let matchId: string;
  try { matchId = parseMatchId(id); } catch { notFound(); }
  let match;
  try { match = await getMatchById(matchId); }
  catch { return <p role="alert">No se pudo cargar el partido. Inténtalo de nuevo.</p>; }
  if (!match) return <><h1>Partido no encontrado</h1><Link href="/admin/matches" className="underline">Volver a partidos</Link></>;

  let loaded;
  try {
    loaded = await Promise.all([getTeams(), getCompetitions(), getMatchPlayers(match.id), getEligibleSquadPlayers(match)]);
  } catch {
    return <><h1>Gestionar partido</h1><p role="alert">No se pudo cargar la convocatoria o los datos del partido. Inténtalo de nuevo.</p></>;
  }
  const [teams, competitions, squad, eligible] = loaded;
  const teamNames = new Map(teams.map(team => [team.id, team.name]));
  const selected = new Set(squad.map(entry => entry.player_id));
  const available = eligible.filter(player => !selected.has(player.id));
  const competition = competitions.find(item => item.id === match.competition_id);
  const date = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(new Date(match.match_date));

  return <>
    <h1 className="text-2xl font-semibold">Gestionar partido</h1>
    <p className="mt-4"><strong>{teamNames.get(match.home_team_id) ?? "Equipo local"} — {teamNames.get(match.away_team_id) ?? "Equipo visitante"}</strong></p>
    <p><time dateTime={match.match_date}>{date} UTC</time></p>
    <p>Resultado: {match.home_score === null && match.away_score === null ? "Sin resultado" : `${match.home_score ?? "—"} - ${match.away_score ?? "—"}`}</p>
    <p>Estado: {matchStatusLabels[match.status]}</p>
    <p>Competición: {competition?.name ?? (match.competition_id ? "No disponible" : "Sin competición")}</p>
    <Link href={`/admin/matches/${match.id}/edit`} className="underline">Editar datos del partido</Link>
    <p><Link href={`/admin/matches/${match.id}/results`} className="underline">Resultados / MVP</Link></p>
    {match.status === "voting" && isDevelopmentVotingEnabled() && <p><Link href={`/matches/${match.id}/vote`} className="underline">Votar (desarrollo)</Link></p>}

    <h2 className="mt-8 text-xl">Convocatoria</h2>
    <p>Puedes gestionar jugadores de ambos equipos. Solo se pueden añadir jugadores activos.</p>
    {available.length === 0 && <p>No hay jugadores activos disponibles para añadir.</p>}
    <CreateForm action={addMatchPlayerAction.bind(null, match.id)} disabled={available.length === 0} submitLabel="Añadir a la convocatoria" fields={[
      { name: "player_id", label: "Jugador", required: true, options: available.map(player => ({
        value: player.id,
        label: `${player.first_name} ${player.last_name ?? ""} — ${teamNames.get(player.team_id) ?? "Equipo"} — ${player.position}${player.shirt_number === null ? "" : ` — Dorsal ${player.shirt_number}`}`,
      })) },
    ]} />

    {squad.length === 0 ? <p>La convocatoria está vacía.</p> : squad.map(entry => (
      <section key={entry.id} className="my-6 border-t pt-4">
        <h3 className="text-lg font-semibold">{entry.player ? `${entry.player.first_name} ${entry.player.last_name ?? ""}` : "Jugador no disponible"}</h3>
        <p>Equipo: {entry.team?.name ?? "No disponible"} · Posición: {entry.player?.position ?? "No disponible"}{entry.player?.shirt_number != null ? ` · Dorsal: ${entry.player.shirt_number}` : ""}</p>
        <CreateForm action={updateMatchPlayerAction.bind(null, match.id, entry.id)} fields={squadStatsFields} submitLabel="Guardar estadísticas" initialValues={{
          starter: entry.starter ? "on" : "", minutes_played: String(entry.minutes_played),
          goals: String(entry.goals), assists: String(entry.assists), yellow_cards: String(entry.yellow_cards),
          red_cards: String(entry.red_cards), clean_sheet: entry.clean_sheet ? "on" : "",
        }} />
        <p>Quitar al jugador de la convocatoria también elimina sus estadísticas de este partido.</p>
        <CreateForm action={removeMatchPlayerAction.bind(null, match.id, entry.id)} fields={[]} submitLabel="Quitar de la convocatoria" />
      </section>
    ))}
    <Link href="/admin/matches" className="underline">Volver a partidos</Link>
  </>;
}
