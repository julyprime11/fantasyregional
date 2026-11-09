import Link from "next/link";
import { notFound } from "next/navigation";

import {
  PLAYER_POSITIONS,
  analyzeOpeningFantasyEconomy,
  getInitialFantasyPlayerPrice,
  simulateFantasyEconomy,
  validateFantasyLineup,
  type EconomySimulationInput,
  type PlayerPosition,
} from "@regional-fantasy/shared";

import { getFantasyLeagues, getFantasyLeagueMembers } from "@/data/fantasy-leagues";
import { getFantasyLineup, getFantasyLineupPlayers } from "@/data/fantasy-lineups";
import { getFantasyMatchPoints } from "@/data/fantasy-match-points";
import { getMatchResults } from "@/data/match-results";
import { getMatches } from "@/data/matches";
import { getPlayersByTeam } from "@/data/players";

// Pantalla temporal para pruebas locales. Ninguna operación escribe datos.
// El layout /admin exige además el permiso canAccessAdmin en servidor.
const MAX_MATCHES = 3;
const MAX_MEMBERS = 25;

export const dynamic = "force-dynamic";

function euros(value: number): string {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function validPosition(value: string): value is PlayerPosition {
  return PLAYER_POSITIONS.includes(value as PlayerPosition);
}

export default async function EconomyPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  // Esta ruta responde 404 cuando Next.js no se ejecuta en desarrollo.
  if (process.env.NODE_ENV !== "development") notFound();

  const { league: leagueId } = await searchParams;
  const leagues = await getFantasyLeagues();
  const league = leagues.find((item) => item.id === leagueId);

  if (!league) {
    return (
      <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2] px-4 py-6">
        <Link href="/admin" className="text-sm font-bold text-[#0f3d2e]">
          ← Administración
        </Link>
        <h1 className="mt-5 text-2xl font-black text-zinc-950">
          Simulación económica
        </h1>
        <p className="mt-2 text-sm text-zinc-600">
          Solo desarrollo · Solo lectura. Selecciona una liga para estudiar sus
          precios y presupuestos sin modificar ningún resultado.
        </p>
        <div className="mt-5 space-y-2">
          {leagues.map((item) => (
            <Link
              key={item.id}
              href={`/admin/economy-preview?league=${encodeURIComponent(item.id)}`}
              className="block rounded-xl bg-white p-4 text-sm font-bold text-zinc-950 shadow-sm"
            >
              {item.name} · {item.team?.name ?? "Equipo"} →
            </Link>
          ))}
          {leagues.length === 0 && (
            <p className="rounded-xl bg-white p-4 text-sm text-zinc-500">
              No hay ligas Fantasy disponibles.
            </p>
          )}
        </div>
      </main>
    );
  }

  const [players, matches, allMembers] = await Promise.all([
    getPlayersByTeam(league.team_id),
    getMatches(),
    getFantasyLeagueMembers(league.id),
  ]);
  const warnings: string[] = [];
  const validPlayers = players.filter((player) => validPosition(player.position));
  const playerById = new Map(validPlayers.map((player) => [player.id, player]));

  if (validPlayers.length !== players.length) {
    warnings.push("Se han omitido jugadores cuya posición no es válida.");
  }

  const closedMatches = matches
    .filter(
      (match) =>
        match.status === "closed" &&
        (match.home_team_id === league.team_id ||
          match.away_team_id === league.team_id),
    )
    .sort(
      (a, b) =>
        Date.parse(a.match_date) - Date.parse(b.match_date) ||
        a.id.localeCompare(b.id),
    );

  if (closedMatches.length > MAX_MATCHES) {
    warnings.push(`Solo se procesan los primeros ${MAX_MATCHES} partidos cerrados.`);
  }
  if (allMembers.length > MAX_MEMBERS) {
    warnings.push(`Solo se procesan los primeros ${MAX_MEMBERS} participantes.`);
  }

  const members = allMembers.slice(0, MAX_MEMBERS);
  const matchInputs: EconomySimulationInput["matches"][number][] = [];
  const lineupInputs: EconomySimulationInput["lineups"][number][] = [];

  for (const match of closedMatches.slice(0, MAX_MATCHES)) {
    const result = await getMatchResults(match.id);
    if (result.status !== "ready" || result.phase !== "final") {
      warnings.push("Se ha omitido un partido sin resultados definitivos.");
      continue;
    }

    matchInputs.push({
      id: match.id,
      matchDate: match.match_date,
      status: "closed",
      teams: [
        {
          teamId: league.team_id,
          playerPoints: result.rows
            .filter(
              (row) =>
                row.entry.team_id === league.team_id &&
                playerById.has(row.entry.player_id),
            )
            .map((row) => ({
              playerId: row.entry.player_id,
              points: row.fantasy?.points ?? null,
            })),
        },
      ],
    });

    for (const member of members) {
      const identity = {
        leagueId: league.id,
        userId: member.user_id,
        matchId: match.id,
      };
      const lineup = await getFantasyLineup(identity);
      if (!lineup) continue;

      const entries = await getFantasyLineupPlayers(lineup.id);
      const selection = entries.map((entry) => playerById.get(entry.player_id));
      const hasUnknown = selection.some((player) => !player);
      const formation = selection
        .filter((player): player is NonNullable<typeof player> => player !== undefined)
        .map((player) => ({
          id: player.id,
          position: player.position as PlayerPosition,
        }));

      if (hasUnknown || !validateFantasyLineup(formation).valid) {
        warnings.push("Se ha omitido un XI histórico incompleto o inválido.");
        continue;
      }

      // Total existente; ya incorpora el bonus de capitán de la aplicación.
      const points = await getFantasyMatchPoints(identity);
      lineupInputs.push({
        ...identity,
        playerIds: entries.map((entry) => entry.player_id),
        totalPoints: points.status === "ready" ? points.total_points : null,
      });
    }
  }

  const report = simulateFantasyEconomy({
    players: validPlayers.map((player) => ({
      id: player.id,
      teamId: player.team_id,
      position: player.position as PlayerPosition,
      active: player.active,
    })),
    matches: matchInputs,
    leagues: [
      {
        id: league.id,
        teamId: league.team_id,
        userIds: members.map((member) => member.user_id),
      },
    ],
    lineups: lineupInputs,
  });

  const team = report.teams.find((item) => item.teamId === league.team_id);
  const firstMatch = matchInputs[0];
  const firstScores = new Map(
    firstMatch?.teams[0]?.playerPoints.map((row) => [row.playerId, row.points]) ?? [],
  );
  const openingAnalysis = firstMatch
    ? analyzeOpeningFantasyEconomy({
        allPlayerIds: validPlayers.map((player) => player.id),
        firstMatchPlayerPoints: firstMatch.teams[0]?.playerPoints ?? [],
        memberUserIds: members.map((member) => member.user_id),
        firstMatchLineups: lineupInputs
          .filter((lineup) => lineup.matchId === firstMatch.id)
          .map((lineup) => ({
            userId: lineup.userId,
            playerIds: lineup.playerIds,
            totalPoints: lineup.totalPoints,
          })),
      })
    : null;
  const openingByUser = new Map(
    openingAnalysis?.members.map((member) => [member.userId, member]) ?? [],
  );
  const names = new Map(
    validPlayers.map((player) => [
      player.id,
      [player.first_name, player.last_name].filter(Boolean).join(" "),
    ]),
  );
  const prices = [...(team?.playerPrices ?? [])].sort(
    (a, b) => b.price - a.price || a.playerId.localeCompare(b.playerId),
  );

  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2] pb-10">
      <header className="rounded-b-[1.5rem] bg-[#0f3d2e] px-4 pb-6 pt-[calc(env(safe-area-inset-top)+1rem)] text-white">
        <Link href="/admin/economy-preview" className="text-xs font-bold text-white/70">
          ← Cambiar liga
        </Link>
        <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-white/50">
          Entorno de desarrollo · Sin escrituras
        </p>
        <h1 className="mt-1 text-2xl font-black">Simulación económica</h1>
        <p className="mt-1 text-sm text-white/70">
          {league.name} · {league.team?.name ?? "Equipo"}
        </p>
      </header>

      <div className="space-y-4 px-4 pt-4">
        <section className="rounded-xl bg-white p-4 text-sm shadow-sm">
          <h2 className="text-base font-black">Viabilidad del presupuesto</h2>
          <p className="mt-2">Partidos cerrados: <strong>{report.processedMatches}</strong></p>
          <p className="mt-1">Participantes analizados: <strong>{report.members.length}</strong></p>
          <p className="mt-1">XI válido más barato: <strong>{team?.cheapestXI ? euros(team.cheapestXI.totalCost) : "No disponible"}</strong></p>
          <p className="mt-1">Formación: <strong>{team?.cheapestXI?.formation ?? "—"}</strong></p>
          <p className="mt-1">Asequible con 90.000 €: <strong>{team?.affordableAtMinimumBudget ? "Sí" : "No"}</strong></p>
          <p className="mt-1">Participantes sin XI asequible: <strong>{report.summary.membersUnableToAffordNextXI}</strong></p>
          <p className="mt-1">XI de jornadas posteriores sobre presupuesto: <strong>{report.summary.historicalLineupsOverBudget} / {report.summary.historicalLineupsChecked}</strong></p>
          <p className="mt-2 text-xs text-zinc-500">
            La primera jornada se analiza por separado frente a 100.000 € iniciales.
            Los XI antiguos nunca se invalidan ni se modifican.
          </p>
        </section>

        <section className="rounded-xl bg-white p-4 text-sm shadow-sm">
          <h2 className="text-base font-black">XI reales de la primera jornada</h2>
          {openingAnalysis ? (
            <>
              <p className="mt-2">XI presentados y comprobados: <strong>{openingAnalysis.lineupsChecked}</strong></p>
              <p className="mt-1">XI que costarían mas de 100.000 €: <strong>{openingAnalysis.lineupsOverBudget}</strong></p>
              <p className="mt-1">Porcentaje por encima del presupuesto: <strong>{openingAnalysis.percentageOverBudget.toFixed(1)}%</strong></p>
              <p className="mt-1">Usuarios que tendrían que cambiar al menos un jugador: <strong>{openingAnalysis.usersNeedingChange}</strong></p>
              <p className="mt-1">XI diferentes: <strong>{openingAnalysis.distinctLineups} de {openingAnalysis.lineupsChecked}</strong></p>
              <p className="mt-1">Usuarios con el XI más repetido: <strong>{openingAnalysis.mostRepeatedLineupUsers}</strong></p>
              <p className="mt-2 text-xs text-zinc-500">
                Solo se cuentan los usuarios con XI valido presentado. Una alineación
                superior al presupuesto exigiria cambios antes de jugar, pero
                aquí no se altera nada. El coste se calcula con precios de apertura,
                antes de aplicar bonificaciones de jornada.
              </p>
            </>
          ) : (
            <p className="mt-2 text-zinc-500">No existen partidos cerrados para el análisis inicial.</p>
          )}
        </section>

        {openingAnalysis && (
          <section className="rounded-xl bg-white p-4 text-sm shadow-sm">
            <h2 className="text-base font-black">Comparativa de umbrales</h2>
            <p className="mt-1 text-xs text-zinc-500">
              Tres simulaciones sobre los mismos puntos reales. Calibrado aplica
              los nuevos umbrales; Anterior reproduce el criterio previo.
            </p>
            <div className="mt-3 space-y-3">
              {openingAnalysis.scenarios.map((scenario) => (
                <div key={scenario.id} className="rounded-xl bg-[#f2f4f2] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-black">{scenario.name}</p>
                    <span className="text-xs font-bold text-[#0f3d2e]">
                      +2.000 € desde {scenario.limits.strongGainFrom} puntos
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-zinc-600">
                    Pierden: <strong>{scenario.losing}</strong> ·
                    Sin cambio: <strong>{scenario.unchanged}</strong> ·
                    Ganan: <strong>{scenario.gaining}</strong>
                  </p>
                  <p className="mt-1 text-xs text-zinc-600">
                    Saldo mas frecuente: <strong>{euros(scenario.mostCommonBudget)}</strong>
                    {" "}({scenario.mostCommonBudgetCount} participantes).
                    Saldos diferentes: <strong>{scenario.distinctBudgets}</strong>
                  </p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-zinc-500">
              Umbrales de -2.000/-1.000/0/+1.000/+2.000 €:
              Calibrado: 65/70/75/80; Anterior: 10/20/30/40;
              Exigente: 25/40/55/70 puntos.
              Estos escenarios no cambian el saldo de nadie.
            </p>
          </section>
        )}

        {warnings.length > 0 && (
          <section className="rounded-xl bg-amber-50 p-4 text-xs text-amber-900">
            <h2 className="font-black">Límites de la prueba</h2>
            {[...new Set(warnings)].map((warning) => (
              <p key={warning} className="mt-1">• {warning}</p>
            ))}
          </section>
        )}

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-black">Precios por jugador</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Precio inicial desde la primera jornada y precio simulado tras las siguientes.
          </p>
          {prices.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No hay precios disponibles.</p>
          ) : (
            <div className="mt-3 divide-y divide-zinc-100">
              {prices.map((item) => (
                <div key={item.playerId} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="min-w-0 truncate">{names.get(item.playerId) ?? "Jugador"}</span>
                  <div className="shrink-0 text-right tabular-nums">
                    <p className="font-bold text-[#0f3d2e]">{euros(item.price)}</p>
                    <p className="text-xs text-zinc-500">
                      Inicial: {euros(getInitialFantasyPlayerPrice(firstScores.get(item.playerId) ?? null))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="text-base font-black">Presupuestos simulados</h2>
          <p className="mt-1 text-xs text-zinc-500">
            Participantes numerados, sin mostrar nombres ni identificadores.
            Puntos y coste del XI real en la primera jornada.
          </p>
          {report.members.length === 0 ? (
            <p className="mt-3 text-sm text-zinc-500">No hay participantes.</p>
          ) : (
            <div className="mt-3 divide-y divide-zinc-100">
              {report.members.map((member, i) => {
                const opening = openingByUser.get(member.userId);
                return (
                  <div key={member.userId} className="flex items-center justify-between gap-3 py-3 text-sm">
                    <span className="shrink-0 font-medium">Participante {i + 1}</span>
                    <div className="text-right tabular-nums">
                      <p className="font-bold">{euros(member.finalBudget)}</p>
                      <p className="text-xs text-zinc-500">
                        Primera jornada: {opening?.points === null || opening?.points === undefined
                          ? "Sin XI puntuado" : `${opening.points} puntos`}
                      </p>
                      <p className="text-xs text-zinc-500">
                        Coste XI: {opening?.lineupCost === null || opening?.lineupCost === undefined
                          ? "Sin XI" : euros(opening.lineupCost)}
                      </p>
                      {opening?.overInitialBudget && (
                        <p className="text-xs font-bold text-amber-700">Superaba 100.000 €</p>
                      )}
                      <p className="text-xs text-zinc-500">
                        Apertura: {euros(member.openingBudget)} · {member.canAffordNextXI ? "XI asequible" : "XI no asequible"}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <p className="px-1 text-xs text-zinc-500">
          Simulación local de solo lectura. No modifica puntos, votos, alineaciónes o saldos.
        </p>
      </div>
    </main>
  );
}
