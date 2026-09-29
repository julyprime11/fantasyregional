import Link from "next/link";
import { notFound } from "next/navigation";
import { parseMatchId } from "@regional-fantasy/shared";
import { getMatchById } from "@/data/matches";
import { getTeams } from "@/data/teams";
import { getCompetitions } from "@/data/competitions";
import { updateMatchAction } from "../../../actions";
import { CreateForm } from "../../../create-form";
import { matchFields, toDateInput } from "../../fields";

export default async function EditMatchPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let matchId: string;
  try { matchId = parseMatchId(id); } catch { notFound(); }
  let loaded;
  try { loaded = await Promise.all([getMatchById(matchId), getTeams(), getCompetitions()]); }
  catch { return <><h1>Editar partido</h1><p role="alert">No se pudo cargar el partido o sus opciones. Inténtalo de nuevo.</p><Link href="/admin/matches" className="underline">Volver a partidos</Link></>; }
  const [match, teams, competitions] = loaded;
  if (!match) return <><h1>Partido no encontrado</h1><p>El partido ya no está disponible.</p><Link href="/admin/matches" className="underline">Volver a partidos</Link></>;
  return <>
    <h1 className="text-2xl font-semibold">Editar partido</h1>
    <p>Todas las fechas y horas se introducen y muestran en UTC.</p>
    {teams.length < 2 && <p>Necesitas al menos dos equipos para guardar.</p>}
    <CreateForm key={match.id} action={updateMatchAction.bind(null, match.id)} fields={matchFields(teams, competitions)} disabled={teams.length < 2} submitLabel="Guardar cambios" initialValues={{
      competition_id: match.competition_id ?? "", home_team_id: match.home_team_id, away_team_id: match.away_team_id,
      match_date: toDateInput(match.match_date), home_score: match.home_score === null ? "" : String(match.home_score),
      away_score: match.away_score === null ? "" : String(match.away_score), status: match.status,
      voting_opens_at: toDateInput(match.voting_opens_at), voting_closes_at: toDateInput(match.voting_closes_at),
    }} />
    <Link href="/admin/matches" className="underline">Cancelar y volver a partidos</Link>
  </>;
}
