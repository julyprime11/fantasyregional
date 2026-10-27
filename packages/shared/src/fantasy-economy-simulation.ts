import type { PlayerPosition } from "./domain";
import {
  getFantasyLine,
  validateFantasyLineup,
} from "./fantasy-lineup";
import {
  FANTASY_ECONOMY,
  getFantasyTeamPointsAverage,
  getInitialFantasyPlayerPrice,
  getNextFantasyBudget,
  getNextFantasyPlayerPrice,
  getOpeningFantasyBudget,
  validateFantasyLineupBudget,
} from "./fantasy-economy";

/** Datos de entrada para una simulación sin acceso a la BD. */
export type EconomySimulationInput = {
  players: readonly {
    id: string;
    teamId: string;
    position: PlayerPosition;
    active: boolean;
  }[];
  matches: readonly {
    id: string;
    matchDate: string;
    status: "scheduled" | "finished" | "voting" | "closed";
    teams: readonly {
      teamId: string;
      playerPoints: readonly { playerId: string; points: number | null }[];
    }[];
  }[];
  leagues: readonly {
    id: string;
    teamId: string;
    userIds: readonly string[];
  }[];
  /** null significa que hay XI, pero aún no existen puntos definitivos. */
  lineups: readonly {
    leagueId: string;
    userId: string;
    matchId: string;
    playerIds: readonly string[];
    totalPoints: number | null;
  }[];
};

export type CheapestFantasyXI = {
  totalCost: number;
  playerIds: string[];
  formation: string;
};

export type EconomySimulationReport = {
  processedMatches: number;
  teams: {
    teamId: string;
    openingMatchId: string | null;
    playerPrices: { playerId: string; price: number }[];
    cheapestXI: CheapestFantasyXI | null;
    affordableAtMinimumBudget: boolean;
  }[];
  members: {
    leagueId: string;
    userId: string;
    openingBudget: number;
    finalBudget: number;
    cheapestXI: number | null;
    canAffordNextXI: boolean;
  }[];
  previousLineups: {
    leagueId: string;
    userId: string;
    matchId: string;
    budgetBefore: number;
    xiCost: number;
    affordable: boolean;
  }[];
  summary: {
    teamsWithoutValidXI: number;
    membersUnableToAffordNextXI: number;
    historicalLineupsOverBudget: number;
    historicalLineupsChecked: number;
  };
};

type PricedPlayer = {
  id: string;
  position: PlayerPosition;
  price: number;
};

/**
 * Busca el XI válido más barato, respetando posiciones reales
 * (1 GK, 3–5 DEF, 3–5 MID y 1–3 FWD).
 * No usa puntos Fantasy para seleccionar automáticamente el mejor XI.
 */
export function getCheapestFantasyXI(
  players: readonly PricedPlayer[],
): CheapestFantasyXI | null {
  const uniqueIds = new Set<string>();
  const groups: Record<"GK" | "DEF" | "MID" | "FWD", PricedPlayer[]> = {
    GK: [], DEF: [], MID: [], FWD: [],
  };
  for (const player of players) {
    if (!player.id || uniqueIds.has(player.id)) {
      throw new RangeError("La plantilla contiene identificadores vacíos o repetidos.");
    }
    uniqueIds.add(player.id);
    if (
      !Number.isSafeInteger(player.price) ||
      player.price < FANTASY_ECONOMY.minimumPlayerPrice ||
      player.price > FANTASY_ECONOMY.maximumPlayerPrice
    ) {
      throw new RangeError("La plantilla contiene un precio no válido.");
    }
    groups[getFantasyLine(player.position)].push(player);
  }
  for (const group of Object.values(groups)) {
    group.sort((a, b) => a.price - b.price || a.id.localeCompare(b.id));
  }

  let cheapest: CheapestFantasyXI | null = null;
  for (let def = 3; def <= 5; def++) {
    for (let mid = 3; mid <= 5; mid++) {
      const fwd = 10 - def - mid;
      if (fwd < 1 || fwd > 3) continue;
      if (
        groups.GK.length < 1 ||
        groups.DEF.length < def ||
        groups.MID.length < mid ||
        groups.FWD.length < fwd
      ) continue;

      const selected = [
        ...groups.GK.slice(0, 1),
        ...groups.DEF.slice(0, def),
        ...groups.MID.slice(0, mid),
        ...groups.FWD.slice(0, fwd),
      ];
      if (!validateFantasyLineup(selected.map(({ id, position }) => ({ id, position }))).valid) {
        throw new Error("La formación calculada no supera la validación compartida.");
      }
      const totalCost = selected.reduce((sum, player) => sum + player.price, 0);
      if (!cheapest || totalCost < cheapest.totalCost) {
        cheapest = {
          totalCost,
          playerIds: selected.map((player) => player.id),
          formation: `${def}-${mid}-${fwd}`,
        };
      }
    }
  }
  return cheapest;
}

const key = (...parts: readonly string[]) => JSON.stringify(parts);

function requireId(id: string, label: string): void {
  if (typeof id !== "string" || !id.trim()) {
    throw new RangeError(`${label} no válido.`);
  }
}

function getTime(iso: string): number {
  const time = Date.parse(iso);
  if (!Number.isFinite(time)) throw new RangeError("Fecha de partido no válida.");
  return time;
}

/**
 * Simulación determinista, solo en memoria. No tiene efectos secundarios.
 * Los datos de entrada deben proceder de puntuaciones finales ya calculadas
 * por el sistema actual, NO de una fórmula Fantasy duplicada.
 *
 * La primera jornada cerrada de cada equipo fija los precios iniciales.
 * Desde la siguiente se actualizan una única vez por partido.
 * Las ligas comparten los precios, nunca el saldo.
 */
export function simulateFantasyEconomy(
  input: EconomySimulationInput,
): EconomySimulationReport {
  const players = new Map<string, (typeof input.players)[number]>();
  const byTeam = new Map<string, (typeof input.players)[number][]>();
  for (const player of input.players) {
    requireId(player.id, "Jugador");
    requireId(player.teamId, "Equipo del jugador");
    getFantasyLine(player.position);
    if (players.has(player.id)) throw new RangeError("Jugador repetido en la plantilla.");
    players.set(player.id, player);
    const roster = byTeam.get(player.teamId) ?? [];
    roster.push(player);
    byTeam.set(player.teamId, roster);
  }

  const leagues = new Map<string, (typeof input.leagues)[number]>();
  const members = new Map<string, { leagueId: string; userId: string; budget: number; openingBudget: number }>();
  for (const league of input.leagues) {
    requireId(league.id, "Liga");
    requireId(league.teamId, "Equipo de la liga");
    if (leagues.has(league.id)) throw new RangeError("Liga duplicada.");
    leagues.set(league.id, league);
    const users = new Set<string>();
    for (const userId of league.userIds) {
      requireId(userId, "Usuario");
      if (users.has(userId)) throw new RangeError("Usuario duplicado en la liga.");
      users.add(userId);
      members.set(key(league.id, userId), {
        leagueId: league.id,
        userId,
        budget: FANTASY_ECONOMY.initialBudget,
        openingBudget: FANTASY_ECONOMY.initialBudget,
      });
    }
  }

  const matchIds = new Set<string>();
  const matches = [...input.matches].sort(
    (a, b) => getTime(a.matchDate) - getTime(b.matchDate) || a.id.localeCompare(b.id),
  );
  const matchTeams = new Map<string, Set<string>>();
  for (const match of matches) {
    requireId(match.id, "Partido");
    getTime(match.matchDate);
    if (matchIds.has(match.id)) throw new RangeError("Partido duplicado.");
    matchIds.add(match.id);
    const teams = new Set<string>();
    for (const result of match.teams) {
      requireId(result.teamId, "Equipo del partido");
      if (teams.has(result.teamId)) throw new RangeError("Equipo duplicado en partido.");
      teams.add(result.teamId);
      const scored = new Set<string>();
      for (const row of result.playerPoints) {
        const player = players.get(row.playerId);
        if (!player || player.teamId !== result.teamId || scored.has(row.playerId)) {
          throw new RangeError("Jugador no válido o repetido en resultados del partido.");
        }
        scored.add(row.playerId);
        if (row.points !== null && !Number.isFinite(row.points)) {
          throw new RangeError("Puntuación Fantasy no finita.");
        }
      }
    }
    matchTeams.set(match.id, teams);
  }

  const lineups = new Map<string, (typeof input.lineups)[number]>();
  for (const lineup of input.lineups) {
    const league = leagues.get(lineup.leagueId);
    if (
      !league ||
      !members.has(key(lineup.leagueId, lineup.userId)) ||
      !matchTeams.get(lineup.matchId)?.has(league.teamId)
    ) {
      throw new RangeError("Alineación sin liga, usuario o partido asociado.");
    }
    const lineupKey = key(lineup.leagueId, lineup.userId, lineup.matchId);
    if (lineups.has(lineupKey)) throw new RangeError("Alineación duplicada.");
    if (lineup.totalPoints !== null && !Number.isFinite(lineup.totalPoints)) {
      throw new RangeError("Puntuación final del XI no finita.");
    }
    const selected = lineup.playerIds.map((id) => {
      const player = players.get(id);
      if (!player || player.teamId !== league.teamId) {
        throw new RangeError("Jugador del XI inexistente o de otro equipo.");
      }
      return player;
    });
    if (!validateFantasyLineup(selected).valid) {
      throw new RangeError("El XI histórico no cumple las reglas de formación.");
    }
    lineups.set(lineupKey, lineup);
  }

  const prices = new Map<string, number>();
  const openingMatches = new Map<string, string>();
  const previousLineups: EconomySimulationReport["previousLineups"] = [];
  let processedMatches = 0;

  for (const match of matches) {
    if (match.status !== "closed") continue;
    processedMatches++;
    for (const result of match.teams) {
      const initial = !openingMatches.has(result.teamId);
      const scores = new Map(result.playerPoints.map(({ playerId, points }) => [playerId, points]));
      const roster = byTeam.get(result.teamId) ?? [];

      if (initial) {
        openingMatches.set(result.teamId, match.id);
        for (const player of roster) {
          prices.set(player.id, getInitialFantasyPlayerPrice(scores.get(player.id) ?? null));
        }
      }

      // Con el precio PRE-partido evaluamos lo que habría costado el XI.
      // La jornada inicial es histórica y se usa como referencia de apertura.
      for (const league of input.leagues) {
        if (league.teamId !== result.teamId) continue;
        for (const userId of league.userIds) {
          const member = members.get(key(league.id, userId));
          if (!member) throw new Error("Miembro de liga inconsistente.");
          const lineup = lineups.get(key(league.id, userId, match.id));
          const total = lineup?.totalPoints ?? null;

          if (initial) {
            member.budget = getOpeningFantasyBudget(total);
            member.openingBudget = member.budget;
          } else {
            if (lineup) {
              const priced = lineup.playerIds.map((id) => ({
                id, price: prices.get(id) ?? FANTASY_ECONOMY.defaultPlayerPrice,
              }));
              const validation = validateFantasyLineupBudget(priced, member.budget);
              previousLineups.push({
                leagueId: league.id,
                userId,
                matchId: match.id,
                budgetBefore: member.budget,
                xiCost: validation.totalCost,
                affordable: validation.valid,
              });
            }
            member.budget = getNextFantasyBudget(member.budget, total);
          }
        }
      }

      if (!initial) {
        const average = getFantasyTeamPointsAverage([...scores.values()]);
        for (const player of roster) {
          const points = scores.get(player.id) ?? null;
          const currentPrice = prices.get(player.id) ?? FANTASY_ECONOMY.defaultPlayerPrice;
          prices.set(
            player.id,
            getNextFantasyPlayerPrice({
              currentPrice,
              fantasyPoints: points,
              teamAveragePoints: average,
            }),
          );
        }
      }
    }
  }

  const teamSummaries = [...byTeam.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([teamId, roster]) => {
      const openingMatchId = openingMatches.get(teamId) ?? null;
      const playerPrices = roster.map((player) => ({
        playerId: player.id,
        price: prices.get(player.id) ?? FANTASY_ECONOMY.defaultPlayerPrice,
      })).sort((a, b) => a.playerId.localeCompare(b.playerId));
      const cheapestXI = openingMatchId
        ? getCheapestFantasyXI(
            roster.filter((player) => player.active).map((player) => ({
              id: player.id,
              position: player.position,
              price: prices.get(player.id) ?? FANTASY_ECONOMY.defaultPlayerPrice,
            })),
          )
        : null;
      return {
        teamId,
        openingMatchId,
        playerPrices,
        cheapestXI,
        affordableAtMinimumBudget: !!cheapestXI &&
          cheapestXI.totalCost <= FANTASY_ECONOMY.minimumBudget,
      };
    });
  const cheapestByTeam = new Map(teamSummaries.map((team) => [team.teamId, team.cheapestXI]));
  const memberSummaries = [...members.values()].map((member) => {
    const teamId = leagues.get(member.leagueId)?.teamId;
    const min = teamId ? cheapestByTeam.get(teamId) ?? null : null;
    return {
      leagueId: member.leagueId,
      userId: member.userId,
      openingBudget: member.openingBudget,
      finalBudget: member.budget,
      cheapestXI: min?.totalCost ?? null,
      canAffordNextXI: min !== null && min.totalCost <= member.budget,
    };
  }).sort((a, b) => a.leagueId.localeCompare(b.leagueId) || a.userId.localeCompare(b.userId));

  return {
    processedMatches,
    teams: teamSummaries,
    members: memberSummaries,
    previousLineups,
    summary: {
      teamsWithoutValidXI: teamSummaries.filter((team) =>
        team.openingMatchId && !team.cheapestXI).length,
      membersUnableToAffordNextXI: memberSummaries.filter((member) =>
        member.cheapestXI !== null && !member.canAffordNextXI).length,
      historicalLineupsOverBudget: previousLineups.filter((row) => !row.affordable).length,
      historicalLineupsChecked: previousLineups.length,
    },
  };
}
