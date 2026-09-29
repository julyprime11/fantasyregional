import Link from "next/link";
import { connection } from "next/server";
import { getClubs } from "@/data/clubs";
import { getTeams } from "@/data/teams";
import { createTeamAction } from "../actions";
import { CreateForm } from "../create-form";
export default async function TeamsPage() {
  await connection();
  let loaded;
  try { loaded = await Promise.all([getClubs(), getTeams()]); } catch { return <><h1>Equipos</h1><p role="alert">No se pudieron cargar los equipos y clubes. Inténtalo de nuevo.</p></>; }
  const [clubs, teams] = loaded;
  const clubNames = new Map(clubs.map(club => [club.id, club.name]));
  return <><h1 className="text-2xl font-semibold">Equipos</h1><h2 className="mt-6 text-xl">Crear equipo</h2>
    {clubs.length === 0 && <p>Primero <Link className="underline" href="/admin/clubs">crea un club</Link>.</p>}
    <CreateForm action={createTeamAction} disabled={clubs.length === 0} fields={[
      { name: "club_id", label: "Club", required: true, options: clubs.map(club => ({ value: club.id, label: club.name })) },
      { name: "name", label: "Nombre", required: true }, { name: "category", label: "Categoría" },
    ]} />
    <h2 className="text-xl">Equipos existentes</h2>
    {teams.length === 0 ? <p>No hay equipos todavía.</p> : <ul className="mt-4 space-y-3">{teams.map(team => <li key={team.id}>
      <strong>{team.name}</strong><p>Club: {clubNames.get(team.club_id) ?? "Club no disponible"}</p><p>Categoría: {team.category ?? "Sin categoría"}</p>
    </li>)}</ul>}</>;
}
