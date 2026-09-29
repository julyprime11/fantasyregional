import { connection } from "next/server";
import { getTeams, type TeamRow } from "@/data/teams";

export default async function Home() {
  await connection();

  let teams: TeamRow[] = [];
  let queryFailed = false;

  try {
    teams = await getTeams();
  } catch {
    queryFailed = true;
  }

  return (
    <main className="p-8">
      <h1 className="mb-6 text-3xl font-semibold">Regional Fantasy</h1>
      {queryFailed ? (
        <p role="alert">No se pudieron cargar los equipos. Inténtalo de nuevo más tarde.</p>
      ) : teams.length === 0 ? (
        <p>No hay equipos disponibles.</p>
      ) : (
        <ul className="space-y-4">
          {teams.map((team) => (
            <li key={team.id}>
              <h2 className="text-xl font-medium">{team.name}</h2>
              <p>Categoría: {team.category ?? "Sin categoría"}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
