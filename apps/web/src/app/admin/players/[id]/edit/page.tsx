import Link from "next/link";
import { notFound } from "next/navigation";
import { parsePlayerId } from "@regional-fantasy/shared";
import { getPlayerById } from "@/data/players";
import { getTeams } from "@/data/teams";
import { updatePlayerAction } from "../../../actions";
import { CreateForm } from "../../../create-form";
import { playerFields } from "../../fields";

export default async function EditPlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try { parsePlayerId(id); } catch { notFound(); }

  let loaded;
  try {
    loaded = await Promise.all([getPlayerById(id), getTeams()]);
  } catch {
    return <>
      <h1 className="text-2xl font-semibold">Editar jugador</h1>
      <p role="alert">No se pudo cargar el jugador o los equipos. Inténtalo de nuevo.</p>
      <Link className="underline" href="/admin/players">Volver a jugadores</Link>
    </>;
  }
  const [player, teams] = loaded;
  if (!player) return <>
    <h1 className="text-2xl font-semibold">Jugador no encontrado</h1>
    <p>El jugador ya no está disponible.</p>
    <Link className="underline" href="/admin/players">Volver a jugadores</Link>
  </>;

  return <>
    <h1 className="text-2xl font-semibold">Editar jugador</h1>
    <p className="mt-4">Marca o desmarca «Activo» para activar o desactivar al jugador.</p>
    {teams.length === 0 && <p>No hay equipos disponibles. Crea un equipo antes de guardar.</p>}
    <CreateForm
      key={player.id}
      action={updatePlayerAction.bind(null, player.id)}
      fields={playerFields(teams)}
      disabled={teams.length === 0}
      submitLabel="Guardar cambios"
      initialValues={{
        first_name: player.first_name,
        last_name: player.last_name ?? "",
        shirt_number: player.shirt_number === null ? "" : String(player.shirt_number),
        position: player.position,
        image_url: player.image_url ?? "",
        active: player.active ? "on" : "",
        team_id: player.team_id,
      }}
    />
    <Link className="underline" href="/admin/players">Cancelar y volver a jugadores</Link>
  </>;
}
