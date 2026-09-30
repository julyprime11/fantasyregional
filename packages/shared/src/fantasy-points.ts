export type FantasyPlayerPointsInput = {
  player_id: string;
  final_rating: number | null;
};

export type FantasyPlayerPointsResult = {
  player_id: string;
  points: number;
  rateable: boolean;
};

export type FantasyLineupPointsResult = {
  players: FantasyPlayerPointsResult[];
  total_points: number;
};

export function calculateFantasyPlayerPoints(
  input: FantasyPlayerPointsInput,
): FantasyPlayerPointsResult {
  if (
    input.final_rating === null ||
    !Number.isFinite(input.final_rating)
  ) {
    return {
      player_id: input.player_id,
      points: 0,
      rateable: false,
    };
  }

  return {
    player_id: input.player_id,
    points: Math.round(input.final_rating),
    rateable: true,
  };
}

export function calculateFantasyLineupPoints(
  players: readonly FantasyPlayerPointsInput[],
): FantasyLineupPointsResult {
  const results = players.map(
    calculateFantasyPlayerPoints,
  );

  const totalPoints = results.reduce(
    (total, player) =>
      total + player.points,
    0,
  );

  return {
    players: results,
    total_points: totalPoints,
  };
}