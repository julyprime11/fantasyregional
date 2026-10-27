/**
 * Reglas de la economía Fantasy (fase de diseño).
 *
 * NO se llaman desde el guardado de XI ni desde Supabase todavía.
 * Los puntos Fantasy continúan siendo globales por jugador/partido.
 * La economía futura usará precios globales y presupuestos por usuario/liga.
 * Todas las cantidades son créditos enteros, nunca euros.
 */
export const FANTASY_ECONOMY = Object.freeze({
  initialBudget: 100,
  maximumBudget: 120,
  budgetPointsPerCredit: 20,
  maxBudgetGainPerMatchday: 2,
  minimumPlayerPrice: 4,
  maximumPlayerPrice: 18,
  defaultPlayerPrice: 8,
  initialPriceHistorySize: 3,
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
 * Precio de apertura para la primera jornada económica.
 * Los resultados llegan ordenados de más antiguo a más reciente.
 * Únicamente deben pasarse puntuaciones globales definitivas.
 * Si no hay historial, el precio de referencia es 8 créditos.
 */
export function getInitialFantasyPlayerPrice(
  recentFinalPoints: readonly number[],
): number {
  if (recentFinalPoints.length === 0) {
    return FANTASY_ECONOMY.defaultPlayerPrice;
  }

  const latest = recentFinalPoints.slice(-FANTASY_ECONOMY.initialPriceHistorySize);
  for (const points of latest) {
    assertFinite(points, "Los puntos del historial");
  }

  const average = latest.reduce((sum, points) => sum + points, 0) / latest.length;

  if (average <= 0) return 5;
  if (average <= 3) return 7;
  if (average <= 5) return 9;
  if (average <= 7) return 11;
  if (average <= 9) return 13;
  return 15;
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
  let change = 0;

  if (difference >= 4) change = 2;
  else if (difference >= 2) change = 1;
  else if (difference <= -4) change = -2;
  else if (difference <= -2) change = -1;

  return Math.max(
    FANTASY_ECONOMY.minimumPlayerPrice,
    Math.min(FANTASY_ECONOMY.maximumPlayerPrice, currentPrice + change),
  );
}

/**
 * Presupuesto por usuario/liga para la siguiente jornada.
 * El coste del XI NO se descuenta: es un límite de selección, sin fichajes.
 * null = jornada sin puntuación definitiva; no hay ingreso.
 * El ingreso se aplicará una única vez por jornada cerrada en la futura BD.
 */
export function getNextFantasyBudget(
  currentBudget: number,
  matchdayPoints: number | null,
): number {
  assertIntegerRange(currentBudget, 0, FANTASY_ECONOMY.maximumBudget, "El presupuesto");
  if (matchdayPoints === null) return currentBudget;
  assertFinite(matchdayPoints, "Los puntos de la jornada");

  const gain = Math.min(
    FANTASY_ECONOMY.maxBudgetGainPerMatchday,
    Math.floor(Math.max(0, matchdayPoints) / FANTASY_ECONOMY.budgetPointsPerCredit),
  );

  return Math.min(FANTASY_ECONOMY.maximumBudget, currentBudget + gain);
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
