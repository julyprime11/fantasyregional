import Link from "next/link";
import { connection } from "next/server";
import { getPlayers } from "@/data/players";
import { getTeams } from "@/data/teams";
import { createPlayerAction } from "../actions";
import { CreateForm } from "../create-form";
import { playerFields } from "./fields";
export default async function PlayersPage() {
  await connection();
  let loaded;
  try { loaded = await Promise.all([getTeams(), getPlayers()]); } catch { return <><h1>Jugadores</h1><p role="alert">No se pudieron cargar los jugadores y equipos. Inténtalo de nuevo.</p></>; }
  const [teams, players] = loaded;
  const teamNames = new Map(teams.map(team => [team.id, team.name]));
  return <><h1 className="text-2xl font-semibold">Jugadores</h1><h2 className="mt-6 text-xl">Crear jugador</h2>
    {teams.length === 0 && <p>Primero <Link className="underline" href="/admin/teams">crea un equipo</Link>.</p>}
    <CreateForm action={createPlayerAction} disabled={teams.length === 0} fields={playerFields(teams)} />
    <h2 className="text-xl">Jugadores existentes</h2>
    {players.length === 0 ? <p>No hay jugadores todavía.</p> : <ul className="mt-4 space-y-3">{players.map(player => <li key={player.id}>
      <strong>{player.first_name} {player.last_name}</strong><p>Equipo: {teamNames.get(player.team_id) ?? "Equipo no disponible"}</p>
      <p>{player.position} · Dorsal: {player.shirt_number ?? "Sin dorsal"} · {player.active ? "Activo" : "Inactivo"}</p>
      {player.image_url && <p className="break-all">Imagen: {player.image_url}</p>}
      <Link className="underline" href={`/admin/players/${player.id}/edit`}>Editar</Link>
    </li>)}</ul>}</>;
}
