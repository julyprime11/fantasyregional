/**
 * Reglas de la economía Fantasy (fase de diseño).
 *
 * NO se llaman desde el guardado de XI ni desde Supabase todavía.
 * Los puntos Fantasy continúan siendo globales por jugador/partido.
 * La economía futura usará precios globales y presupuestos por usuario/liga.
 * Los importes están expresados en euros enteros ficticios (sin céntimos).
 */
export const FANTASY_ECONOMY = Object.freeze({
  currency: "EUR",
  initialBudget: 100_000,
  minimumBudget: 90_000,
  maximumBudget: 120_000,
  budgetLossThreshold: 10,
  budgetNeutralThreshold: 20,
  budgetGainThreshold: 30,
  budgetStrongGainThreshold: 40,
  budgetAdjustmentStep: 1_000,
  maxBudgetGainPerMatchday: 2_000,
  maxBudgetLossPerMatchday: 2_000,
  minimumPlayerPrice: 4_000,
  maximumPlayerPrice: 18_000,
  defaultPlayerPrice: 8_000,
  priceAdjustmentStep: 1_000,
});

export type FantasyPlayerPricePerformance = {
  currentPrice: number;
  /** null significa que el jugador no tiene puntuación válida en el partido. */
  fantasyPoints: number | null;
  /** Media de puntos de los jugadores con puntuación válida del mismo equipo/partido. */
  teamAveragePoints: number | null;
};

export type FantasyPricedLineupPlayer = {
  id: string;
  price: number;
};

export type FantasyLineupBudgetValidation = {
  valid: boolean;
  totalCost: number;
  remainingBudget: number;
  errors: string[];
};

function assertFinite(value: number, field: string): void {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${field} debe ser un número finito.`);
  }
}

function assertIntegerRange(
  value: number,
  minimum: number,
  maximum: number,
  field: string,
): void {
  if (!Number.isSafeInteger(value) || value < minimum || value > maximum) {
    throw new RangeError(`${field} debe ser un entero entre ${minimum} y ${maximum}.`);
  }
}

/**
 * Precio de salida de cada jugador cuando activemos la economía.
 * Se utiliza exclusivamente su PRIMER partido oficial con valoración
 * Fantasy definitiva. La misma valoración global se aplica en todas
 * las ligas; no usamos una nota o puntuación específica de una liga.
 *
 * null = no disputó o no tiene puntuación definitiva: 8.000 €.
 * El partido utilizado para el precio inicial NO se procesa después
 * como una subida/bajada adicional: así evitamos contabilizarlo dos veces.
 */
export function getInitialFantasyPlayerPrice(
  firstOfficialMatchPoints: number | null,
): number {
  if (firstOfficialMatchPoints === null) {
    return FANTASY_ECONOMY.defaultPlayerPrice;
  }
  assertFinite(firstOfficialMatchPoints, "Los puntos de la primera jornada oficial");

  if (firstOfficialMatchPoints <= 0) return 5_000;
  if (firstOfficialMatchPoints <= 3) return 7_000;
  if (firstOfficialMatchPoints <= 5) return 9_000;
  if (firstOfficialMatchPoints <= 7) return 11_000;
  if (firstOfficialMatchPoints <= 9) return 13_000;
  return 15_000;
}

/**
 * Referencia compartida por todos los jugadores puntuados de un equipo.
 * Nunca utiliza los puntos de la liga Fantasy de un usuario concreto.
 */
export function getFantasyTeamPointsAverage(
  playerPoints: readonly (number | null)[],
): number | null {
  const valid = playerPoints.filter((value): value is number => value !== null);
  if (valid.length === 0) return null;

  for (const value of valid) {
    assertFinite(value, "La puntuación del jugador");
  }

  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

/**
 * Evolución del precio tras un partido con puntuaciones DEFINITIVAS.
 * Movimiento relativo a la media del propio equipo, para evitar
 * que todos los precios crezcan automáticamente cada jornada.
 * Un jugador sin puntuación válida mantiene su precio.
 */
export function getNextFantasyPlayerPrice({
  currentPrice,
  fantasyPoints,
  teamAveragePoints,
}: FantasyPlayerPricePerformance): number {
  assertIntegerRange(
    currentPrice,
    FANTASY_ECONOMY.minimumPlayerPrice,
    FANTASY_ECONOMY.maximumPlayerPrice,
    "El precio",
  );

  if (fantasyPoints === null) return currentPrice;
  assertFinite(fantasyPoints, "Los puntos Fantasy");

  if (teamAveragePoints === null) {
    throw new RangeError("Se necesita la media del equipo para actualizar el precio.");
  }
  assertFinite(teamAveragePoints, "La media del equipo");

  const difference = fantasyPoints - teamAveragePoints;
  const step = FANTASY_ECONOMY.priceAdjustmentStep;
  let change = 0;

  if (difference >= 4) change = 2 * step;
  else if (difference >= 2) change = step;
  else if (difference <= -4) change = -2 * step;
  else if (difference <= -2) change = -step;

  return Math.max(
    FANTASY_ECONOMY.minimumPlayerPrice,
    Math.min(FANTASY_ECONOMY.maximumPlayerPrice, currentPrice + change),
  );
}

/**
 * Saldo del usuario dentro de una liga tras una jornada.
 * Usamos el total Fantasy del XI ya calculado por la lógica actual:
 * NO volvemos a calcular las puntuaciones de cada futbolista.
 *
 * - Menos de 10 puntos: -2.000 €.
 * - De 10 a 19: -1.000 €.
 * - De 20 a 29: sin cambio.
 * - De 30 a 39: +1.000 €.
 * - 40 o más: +2.000 €.
 *
 * null = no existe una alineación con puntuación definitiva: sin cambio.
 * El saldo limita el coste de un nuevo XI pero no se gasta al alinearlo.
 * La futura persistencia debe aplicar cada jornada UNA SOLA VEZ.
 */
export function getNextFantasyBudget(
  currentBudget: number,
  matchdayPoints: number | null,
): number {
  assertIntegerRange(
    currentBudget,
    FANTASY_ECONOMY.minimumBudget,
    FANTASY_ECONOMY.maximumBudget,
    "El presupuesto",
  );
  if (matchdayPoints === null) return currentBudget;
  assertFinite(matchdayPoints, "Los puntos de la jornada");

  const step = FANTASY_ECONOMY.budgetAdjustmentStep;
  let change = 0;

  if (matchdayPoints < FANTASY_ECONOMY.budgetLossThreshold) {
    change = -FANTASY_ECONOMY.maxBudgetLossPerMatchday;
  } else if (matchdayPoints < FANTASY_ECONOMY.budgetNeutralThreshold) {
    change = -step;
  } else if (matchdayPoints < FANTASY_ECONOMY.budgetGainThreshold) {
    change = 0;
  } else if (matchdayPoints < FANTASY_ECONOMY.budgetStrongGainThreshold) {
    change = step;
  } else {
    change = FANTASY_ECONOMY.maxBudgetGainPerMatchday;
  }

  return Math.max(
    FANTASY_ECONOMY.minimumBudget,
    Math.min(FANTASY_ECONOMY.maximumBudget, currentBudget + change),
  );
}

/**
 * Saldo de apertura del usuario usando el XI de la primera jornada oficial.
 * Si no presentó XI válido o todavía no hay puntos definitivos, usar null.
 */
export function getOpeningFantasyBudget(
  firstOfficialLineupPoints: number | null,
): number {
  return getNextFantasyBudget(
    FANTASY_ECONOMY.initialBudget,
    firstOfficialLineupPoints,
  );
}

/**
 * Reglas monetarias adicionales a validateFantasyLineup (posiciones).
 * Se utilizarán en servidor con los precios guardados para el partido,
 * nunca con precios enviados por el cliente.
 */
export function validateFantasyLineupBudget(
  players: readonly FantasyPricedLineupPlayer[],
  budget: number,
): FantasyLineupBudgetValidation {
  const errors: string[] = [];

  if (!Number.isSafeInteger(budget) || budget < 0 || budget > FANTASY_ECONOMY.maximumBudget) {
    errors.push("Presupuesto no válido.");
  }

  if (players.length !== 11) {
    errors.push("El XI debe tener exactamente 11 jugadores.");
  }

  const ids = new Set<string>();
  let totalCost = 0;

  for (const player of players) {
    if (!player.id || ids.has(player.id)) {
      errors.push("El XI contiene un jugador duplicado o sin identificador.");
    }
    ids.add(player.id);

    if (
      !Number.isSafeInteger(player.price) ||
      player.price < FANTASY_ECONOMY.minimumPlayerPrice ||
      player.price > FANTASY_ECONOMY.maximumPlayerPrice
    ) {
      errors.push("El XI contiene un precio de jugador no válido.");
    } else {
      totalCost += player.price;
    }
  }

  if (Number.isSafeInteger(budget) && budget >= 0 && totalCost > budget) {
    errors.push("El coste del XI supera el presupuesto disponible.");
  }

  return {
    valid: errors.length === 0,
    totalCost,
    remainingBudget: budget - totalCost,
    errors,
  };
}
