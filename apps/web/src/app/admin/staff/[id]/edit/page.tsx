import Link from "next/link";
import { notFound } from "next/navigation";
import { parseStaffId } from "@regional-fantasy/shared";
import { getStaffById } from "@/data/staff";
import { getTeams } from "@/data/teams";
import { updateStaffAction } from "../../../actions";
import { CreateForm } from "../../../create-form";
import { staffFields } from "../../fields";

export default async function EditStaffPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let staffId: string;
  try { staffId = parseStaffId(id); } catch { notFound(); }

  let loaded;
  try {
    loaded = await Promise.all([getStaffById(staffId), getTeams()]);
  } catch {
    return <>
      <h1 className="text-2xl font-semibold">Editar miembro del cuerpo técnico</h1>
      <p role="alert">No se pudo cargar el miembro o los equipos. Inténtalo de nuevo.</p>
      <Link className="underline" href="/admin/staff">Volver al cuerpo técnico</Link>
    </>;
  }
  const [member, teams] = loaded;
  if (!member) return <>
    <h1 className="text-2xl font-semibold">Miembro no encontrado</h1>
    <p>El miembro del cuerpo técnico ya no está disponible.</p>
    <Link className="underline" href="/admin/staff">Volver al cuerpo técnico</Link>
  </>;

  return <>
    <h1 className="text-2xl font-semibold">Editar miembro del cuerpo técnico</h1>
    <p className="mt-4">Marca o desmarca «Activo» para activar o desactivar al miembro sin eliminarlo.</p>
    {teams.length === 0 && <p>No hay equipos disponibles. Crea un equipo antes de guardar.</p>}
    <CreateForm
      key={member.id}
      action={updateStaffAction.bind(null, member.id)}
      fields={staffFields(teams)}
      disabled={teams.length === 0}
      submitLabel="Guardar cambios"
      initialValues={{
        team_id: member.team_id,
        first_name: member.first_name,
        last_name: member.last_name ?? "",
        role: member.role,
        image_url: member.image_url ?? "",
        active: member.active ? "on" : "",
      }}
    />
    <Link className="underline" href="/admin/staff">Cancelar y volver al cuerpo técnico</Link>
  </>;
}
