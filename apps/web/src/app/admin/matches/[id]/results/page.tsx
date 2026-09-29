import Link from "next/link";
import { notFound } from "next/navigation";
import { parseMatchId } from "@regional-fantasy/shared";
import { getMatchResults } from "@/data/match-results";

const display = (value: number | null): string => value === null ? "—" : value.toFixed(2);

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let matchId: string;
  try { matchId = parseMatchId(id); } catch { notFound(); }
  let result;
  try { result = await getMatchResults(matchId); }
  catch { return <><h1>Resultados / MVP</h1><p role="alert">No se pudieron calcular los resultados. Inténtalo de nuevo.</p></>; }
  if (result.status === "not_found") notFound();
  if (result.status === "not_ready") return <>
    <h1 className="text-2xl font-semibold">Resultados / MVP</h1>
    <p>{result.match.status === "finished" ? "La votación de este partido todavía no se ha abierto." : "Los resultados no están disponibles para un partido programado."}</p>
    <Link href={`/admin/matches/${matchId}`} className="underline">Volver al partido</Link>
  </>;
  const name = (entry: (typeof result.rows)[number]["entry"]) => entry.player
    ? `${entry.player.first_name} ${entry.player.last_name ?? ""}`.trim() : "Jugador no disponible";
  return <>
    <h1 className="text-2xl font-semibold">{result.phase === "provisional" ? "Resultados provisionales" : "Resultados finales"}</h1>
    {result.phase === "provisional" && <p>Las puntuaciones y el MVP pueden cambiar mientras llegan nuevos votos.</p>}
    <p className="my-4">Calculados a partir de los datos actuales. Los valores se muestran con dos decimales.</p>
    <p>Mínimo de votos por jugador: {result.minimumVotes}.</p>
    <h2 className="mt-4 font-semibold">{result.phase === "provisional" ? "MVP provisional" : "MVP final"}</h2>
    {result.mvp.status === "none" ? <p>Sin MVP: no hay jugadores con minutos y votos suficientes.</p> : <>
      {result.mvp.status === "shared" && <p className="font-semibold">MVP compartido</p>}
      <ul>{result.mvp.players.map(player => {
        const entry = result.rows.find(row => row.entry.player_id === player.player_id)?.entry;
        return <li key={player.player_id}>{entry ? name(entry) : "Jugador no disponible"} — {display(player.final_rating)}</li>;
      })}</ul>
    </>}
    {result.rows.length === 0 ? <p>No hay jugadores en la convocatoria.</p> : <div className="my-6 overflow-x-auto">
      <table className="w-full text-left">
        <caption className="sr-only">Estadísticas y puntuaciones del partido</caption>
        <thead><tr>{["Jugador", "Equipo", "Posición", "Minutos", "Goles", "Asistencias", "Amarillas", "Rojas", "Portería a cero", "Panel", "Estadística", "Final", "Votos", "Estado"].map(label => <th key={label} scope="col" className="border-b p-2">{label}</th>)}</tr></thead>
        <tbody>{result.rows.map(({ entry, rating }) => <tr key={entry.id}>
          <th scope="row" className="border-b p-2 font-normal">{name(entry)}</th>
          <td className="border-b p-2">{entry.team?.name ?? "—"}</td>
          <td className="border-b p-2">{entry.player?.position ?? "—"}</td>
          {[entry.minutes_played, entry.goals, entry.assists, entry.yellow_cards, entry.red_cards].map((value, index) => <td key={index} className="border-b p-2">{value}</td>)}
          <td className="border-b p-2">{entry.clean_sheet ? "Sí" : "No"}</td>
          <td className="border-b p-2">{display(rating.panel_average)}</td>
          <td className="border-b p-2">{display(rating.statistical_score)}</td>
          <td className="border-b p-2">{display(rating.final_rating)}</td>
          <td className="border-b p-2">{rating.vote_count}</td>
          <td className="border-b p-2">{rating.reason ?? "Calculada"}</td>
        </tr>)}</tbody>
      </table>
    </div>}
    <Link href={`/admin/matches/${matchId}`} className="underline">Volver al partido</Link>
  </>;
}
