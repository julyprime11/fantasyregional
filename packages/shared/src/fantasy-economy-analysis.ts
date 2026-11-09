import {
  FANTASY_ECONOMY,
  getInitialFantasyPlayerPrice,
  getOpeningFantasyBudget,
} from "./fantasy-economy";

export type OpeningLineup = {
  userId: string;
  playerIds: readonly string[];
  totalPoints: number | null;
};

export type OpeningBudgetScenario = {
  id: "current" | "intermediate" | "demanding";
  name: string;
  heavyLossBelow: number;
  lossBelow: number;
  gainFrom: number;
  strongGainFrom: number;
};

/** The current thresholds are NOT modified by this analysis. */
export const OPENING_BUDGET_SCENARIOS: readonly OpeningBudgetScenario[] = [
  { id: "current", name: "Calibrado (actual)", heavyLossBelow: 65, lossBelow: 70, gainFrom: 75, strongGainFrom: 80 },
  { id: "intermediate", name: "Anterior (comparación)", heavyLossBelow: 10, lossBelow: 20, gainFrom: 30, strongGainFrom: 40 },
  { id: "demanding", name: "Exigente", heavyLossBelow: 25, lossBelow: 40, gainFrom: 55, strongGainFrom: 70 },
];

export type OpeningMemberAnalysis = {
  userId: string;
  hasLineup: boolean;
  points: number | null;
  lineupCost: number | null;
  overInitialBudget: boolean;
  openingBudget: number;
};

export type OpeningScenarioSummary = {
  id: OpeningBudgetScenario["id"];
  name: string;
  limits: OpeningBudgetScenario;
  losing: number;
  unchanged: number;
  gaining: number;
  mostCommonBudget: number;
  mostCommonBudgetCount: number;
  distinctBudgets: number;
};

export type OpeningEconomyAnalysis = {
  members: OpeningMemberAnalysis[];
  lineupsChecked: number;
  lineupsOverBudget: number;
  percentageOverBudget: number;
  usersNeedingChange: number;
  distinctLineups: number;
  mostRepeatedLineupUsers: number;
  scenarios: OpeningScenarioSummary[];
};

/**
 * Counterfactual opening-day analysis only. The lineup price uses the FIRST
 * official final match prices, with 100,000 EUR as the pre-match budget.
 * Missing lineups are not confused with a lineup scoring zero points.
 */
export function analyzeOpeningFantasyEconomy(input: {
  allPlayerIds: readonly string[];
  firstMatchPlayerPoints: readonly { playerId: string; points: number | null }[];
  memberUserIds: readonly string[];
  firstMatchLineups: readonly OpeningLineup[];
}): OpeningEconomyAnalysis {
  const prices = new Map<string, number>();
  for (const id of input.allPlayerIds) {
    if (!id || prices.has(id)) throw new RangeError("Jugador vacio o duplicado.");
    prices.set(id, FANTASY_ECONOMY.defaultPlayerPrice);
  }
  const scored = new Set<string>();
  for (const { playerId, points } of input.firstMatchPlayerPoints) {
    if (!prices.has(playerId) || scored.has(playerId)) {
      throw new RangeError("Puntuacion de jugador desconocido o repetido.");
    }
    scored.add(playerId);
    prices.set(playerId, getInitialFantasyPlayerPrice(points));
  }
  const memberIds = new Set<string>();
  for (const id of input.memberUserIds) {
    if (!id || memberIds.has(id)) throw new RangeError("Miembro vacio o duplicado.");
    memberIds.add(id);
  }
  const lineups = new Map<string, OpeningLineup>();
  for (const lineup of input.firstMatchLineups) {
    if (!memberIds.has(lineup.userId) || lineups.has(lineup.userId)) {
      throw new RangeError("XI repetido o de un usuario no participante.");
    }
    if (lineup.playerIds.length !== 11 || new Set(lineup.playerIds).size !== 11) {
      throw new RangeError("El XI debe contener once jugadores distintos.");
    }
    if (lineup.playerIds.some((id) => !prices.has(id))) {
      throw new RangeError("Jugador desconocido en XI.");
    }
    if (lineup.totalPoints !== null && !Number.isFinite(lineup.totalPoints)) {
      throw new RangeError("Los puntos del XI deben ser finitos.");
    }
    lineups.set(lineup.userId, lineup);
  }

  const members: OpeningMemberAnalysis[] = input.memberUserIds.map((userId) => {
    const lineup = lineups.get(userId);
    const lineupCost = lineup
      ? lineup.playerIds.reduce((sum, id) => sum + (prices.get(id) ?? 0), 0)
      : null;
    return {
      userId,
      hasLineup: !!lineup,
      points: lineup?.totalPoints ?? null,
      lineupCost,
      overInitialBudget: lineupCost !== null && lineupCost > FANTASY_ECONOMY.initialBudget,
      openingBudget: getOpeningFantasyBudget(lineup?.totalPoints ?? null),
    };
  });
  const lineupsChecked = lineups.size;
  const lineupsOverBudget = members.filter((m) => m.overInitialBudget).length;
  const lineupFrequencies = new Map<string, number>();
  for (const lineup of lineups.values()) {
    const signature = JSON.stringify([...lineup.playerIds].sort());
    lineupFrequencies.set(signature, (lineupFrequencies.get(signature) ?? 0) + 1);
  }

  const scenarios: OpeningScenarioSummary[] = OPENING_BUDGET_SCENARIOS.map((scenario) => {
    const budgets = new Map<number, number>();
    let losing = 0;
    let unchanged = 0;
    let gaining = 0;
    for (const member of members) {
      const budget = getOpeningBudgetForScenario(member.points, scenario);
      budgets.set(budget, (budgets.get(budget) ?? 0) + 1);
      if (budget < FANTASY_ECONOMY.initialBudget) losing++;
      else if (budget > FANTASY_ECONOMY.initialBudget) gaining++;
      else unchanged++;
    }
    const sorted = [...budgets.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]);
    return {
      id: scenario.id,
      name: scenario.name,
      limits: scenario,
      losing,
      unchanged,
      gaining,
      mostCommonBudget: sorted[0]?.[0] ?? FANTASY_ECONOMY.initialBudget,
      mostCommonBudgetCount: sorted[0]?.[1] ?? 0,
      distinctBudgets: sorted.length,
    };
  });

  return {
    members,
    lineupsChecked,
    lineupsOverBudget,
    percentageOverBudget: lineupsChecked === 0 ? 0 : lineupsOverBudget * 100 / lineupsChecked,
    usersNeedingChange: lineupsOverBudget,
    distinctLineups: lineupFrequencies.size,
    mostRepeatedLineupUsers: Math.max(0, ...lineupFrequencies.values()),
    scenarios,
  };
}

export function getOpeningBudgetForScenario(
  points: number | null,
  scenario: OpeningBudgetScenario,
): number {
  if (points === null) return FANTASY_ECONOMY.initialBudget;
  if (!Number.isFinite(points)) throw new RangeError("Puntos del XI invalidos.");
  if (scenario.id === "current") return getOpeningFantasyBudget(points);
  const step = FANTASY_ECONOMY.budgetAdjustmentStep;
  const delta = points < scenario.heavyLossBelow
    ? -2 * step
    : points < scenario.lossBelow
      ? -step
      : points < scenario.gainFrom
        ? 0
        : points < scenario.strongGainFrom
          ? step
          : 2 * step;
  return Math.max(
    FANTASY_ECONOMY.minimumBudget,
    Math.min(FANTASY_ECONOMY.maximumBudget, FANTASY_ECONOMY.initialBudget + delta),
  );
}
