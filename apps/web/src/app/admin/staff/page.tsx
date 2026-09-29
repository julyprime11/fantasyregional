import Link from "next/link";
import { connection } from "next/server";
import { getStaff } from "@/data/staff";
import { getTeams } from "@/data/teams";
import { createStaffAction } from "../actions";
import { CreateForm } from "../create-form";
import { staffFields } from "./fields";

export default async function StaffPage() {
  await connection();
  let loaded;
  try {
    loaded = await Promise.all([getTeams(), getStaff()]);
  } catch {
    return <>
      <h1 className="text-2xl font-semibold">Cuerpo técnico</h1>
      <p role="alert">No se pudieron cargar el cuerpo técnico y los equipos. Inténtalo de nuevo.</p>
    </>;
  }
  const [teams, staff] = loaded;
  const teamNames = new Map(teams.map(team => [team.id, team.name]));

  return <>
    <h1 className="text-2xl font-semibold">Cuerpo técnico</h1>
    <h2 className="mt-6 text-xl">Crear miembro del cuerpo técnico</h2>
    <p>El cargo es libre: por ejemplo, Entrenador, Preparador físico o Fisioterapeuta.</p>
    {teams.length === 0 && <p>Primero <Link className="underline" href="/admin/teams">crea un equipo</Link>.</p>}
    <CreateForm action={createStaffAction} disabled={teams.length === 0} fields={staffFields(teams)} />
    <h2 className="text-xl">Miembros existentes</h2>
    {staff.length === 0 ? <p>No hay miembros del cuerpo técnico todavía.</p> : (
      <ul className="mt-4 space-y-3">
        {staff.map(member => <li key={member.id}>
          <strong>{member.first_name} {member.last_name}</strong>
          <p>Equipo: {teamNames.get(member.team_id) ?? "Equipo no disponible"}</p>
          <p>Cargo: {member.role} · {member.active ? "Activo" : "Inactivo"}</p>
          {member.image_url && <p className="break-all">Imagen: {member.image_url}</p>}
          <Link className="underline" href={`/admin/staff/${member.id}/edit`}>Editar</Link>
        </li>)}
      </ul>
    )}
  </>;
}
