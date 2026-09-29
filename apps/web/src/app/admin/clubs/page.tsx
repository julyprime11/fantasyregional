import { connection } from "next/server";
import { getClubs } from "@/data/clubs";
import { createClubAction } from "../actions";
import { CreateForm } from "../create-form";
export default async function ClubsPage() {
  await connection();
  let clubs;
  try { clubs = await getClubs(); } catch { return <><h1>Clubes</h1><p role="alert">No se pudieron cargar los clubes. Inténtalo de nuevo.</p></>; }
  return <><h1 className="text-2xl font-semibold">Clubes</h1><h2 className="mt-6 text-xl">Crear club</h2>
    <CreateForm action={createClubAction} fields={[
      { name: "name", label: "Nombre", required: true }, { name: "short_name", label: "Nombre corto" },
      { name: "logo_url", label: "URL del escudo", type: "url" },
    ]} />
    <h2 className="text-xl">Clubes existentes</h2>
    {clubs.length === 0 ? <p>No hay clubes todavía.</p> : <ul className="mt-4 space-y-3">{clubs.map(club => <li key={club.id}>
      <strong>{club.name}</strong>{club.short_name && <span> — {club.short_name}</span>}
      {club.logo_url && <p className="break-all">Escudo: {club.logo_url}</p>}
    </li>)}</ul>}</>;
}
