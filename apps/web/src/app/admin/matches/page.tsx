import Link from "next/link";
import { connection } from "next/server";
import { getMatches } from "@/data/matches";
import { getTeams } from "@/data/teams";
import { getCompetitions } from "@/data/competitions";
import { createMatchAction } from "../actions";
import { CreateForm } from "../create-form";
import { matchFields, matchStatusLabels } from "./fields";

export default async function MatchesPage() {
  await connection();
  let loaded;
  try { loaded = await Promise.all([getMatches(), getTeams(), getCompetitions()]); }
  catch { return <><h1 className="text-2xl font-semibold">Partidos</h1><p role="alert">No se pudieron cargar los partidos y sus opciones. Inténtalo de nuevo.</p></>; }
  const [matches, teams, competitions] = loaded;
  const names = new Map(teams.map(team => [team.id, team.name]));
  const dateFormat = new Intl.DateTimeFormat("es-ES", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
  return <>
    <h1 className="text-2xl font-semibold">Partidos</h1>
    <h2 className="mt-6 text-xl">Crear partido</h2>
    <p>Todas las fechas y horas se introducen y muestran en UTC.</p>
    {teams.length < 2 && <p>Necesitas al menos dos equipos. <Link href="/admin/teams" className="underline">Gestionar equipos</Link></p>}
    <CreateForm action={createMatchAction} fields={matchFields(teams, competitions)} disabled={teams.length < 2} initialValues={{ status: "scheduled" }} />
    <h2 className="text-xl">Partidos existentes</h2>
    {matches.length === 0 ? <p>No hay partidos todavía.</p> : <ul className="mt-4 space-y-4">
      {matches.map(match => <li key={match.id}>
        <strong>{names.get(match.home_team_id) ?? "Equipo no disponible"} — {names.get(match.away_team_id) ?? "Equipo no disponible"}</strong>
        <p><time dateTime={match.match_date}>{dateFormat.format(new Date(match.match_date))} UTC</time></p>
        <p>Resultado: {match.home_score === null && match.away_score === null ? "Sin resultado" : `${match.home_score ?? "—"} - ${match.away_score ?? "—"}`}</p>
        <p>{matchStatusLabels[match.status]}</p>
        <Link href={`/admin/matches/${match.id}`} className="mr-4 underline">Gestionar partido</Link>
        <Link href={`/admin/matches/${match.id}/edit`} className="underline">Editar</Link>
      </li>)}
    </ul>}
  </>;
}
