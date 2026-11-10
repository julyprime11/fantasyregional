/**
 * Estadisticas adicionales por jugador y partido.
 * Fuente unica de etiquetas, explicaciones y puntos Fantasy V3.
 * No son atributos de una liga Fantasy.
 */
export const FANTASY_EXTRA_STATS = [
  {
    field: "penalties_won",
    label: "Penalti provocado",
    points: 2,
    icon: "🥅",
    group: "penalties",
    description: "Provoca un penalti a favor de su equipo.",
  },
  {
    field: "penalties_conceded",
    label: "Penalti cometido",
    points: -2,
    icon: "🥾",
    group: "penalties",
    description: "Comete un penalti a favor del rival.",
  },
  {
    field: "penalties_missed",
    label: "Penalti fallado",
    points: -3,
    icon: "❌",
    group: "penalties",
    description: "Lanza un penalti al poste, fuera o que para el portero.",
  },
  {
    field: "penalties_saved",
    label: "Penalti parado",
    points: 4,
    icon: "🧤",
    group: "penalties",
    description: "El portero detiene un penalti. No cuenta si va al poste o fuera sin pararlo.",
  },
  {
    field: "errors_leading_to_goal",
    label: "Error que acaba en gol",
    points: -2,
    icon: "⚠️",
    group: "other",
    description: "Error defensivo claro que provoca un gol del rival.",
  },
  {
    field: "errors_leading_to_chance",
    label: "Error que genera ocasión",
    points: -1,
    icon: "💥",
    group: "other",
    description: "Error defensivo claro que concede una ocasión clarísima, sin gol.",
  },
  {
    field: "big_chances_missed",
    label: "Ocasión clara fallada",
    points: -1,
    icon: "🎯",
    group: "other",
    description: "Falla una ocasión clarísima: solo ante el portero, a puerta vacía o dentro del área pequeña.",
  },
  {
    field: "own_goals",
    label: "Gol en propia puerta",
    points: -3,
    icon: "🥅",
    group: "other",
    description: "Marca un gol en su propia portería.",
  },
] as const;

export type FantasyExtraStatField =
  (typeof FANTASY_EXTRA_STATS)[number]["field"];

export type FantasyExtraStats =
  Partial<Record<FantasyExtraStatField, number>>;

export const FANTASY_EXTRA_STAT_FIELDS: readonly FantasyExtraStatField[] =
  FANTASY_EXTRA_STATS.map((stat) => stat.field);

export function getFantasyExtraStatsPoints(stats: FantasyExtraStats): number {
  return FANTASY_EXTRA_STATS.reduce(
    (sum, stat) => sum + (stats[stat.field] ?? 0) * stat.points,
    0,
  );
}
