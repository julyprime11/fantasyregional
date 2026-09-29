import type { PlayerPosition } from "./domain";

export interface RatingConfig {
  minimumVotes: number;
  roleWeights: Readonly<Record<string, number>>;
}

export const DEFAULT_RATING_CONFIG: Readonly<RatingConfig> = Object.freeze({
  minimumVotes: 1,
  roleWeights: Object.freeze({}),
});

export type ResultsPhase = "provisional" | "final";

export function getResultsPhase(matchStatus: string): ResultsPhase | null {
  if (matchStatus === "voting") return "provisional";
  if (matchStatus === "closed") return "final";
  return null;
}

export interface PanelVote {
  score: number;
  voter_role: string;
}

export interface PlayerRatingInput {
  player_id: string;
  position: PlayerPosition | null;
  minutes_played: number;
  goals: number;
  assists: number;
  yellow_cards: number;
  red_cards: number;
  clean_sheet: boolean;
  votes: readonly PanelVote[];
}

interface RatingDetails {
  player_id: string;
  panel_average: number | null;
  statistical_score: number | null;
  vote_count: number;
}

export type RatedPlayer = RatingDetails & {
  status: "rated";
  reason: null;
  final_rating: number;
};

export type PlayerRatingResult = RatedPlayer | (RatingDetails & {
  status: "no_minutes" | "insufficient_votes" | "invalid_data";
  reason: string;
  final_rating: null;
});

export type MatchMvpResult = {
  status: "none" | "single" | "shared";
  players: RatedPlayer[];
  final_rating: number | null;
};

// Wing-backs are defenders; wingers are forwards.
const modifiers: Record<PlayerPosition, { goal: number; cleanSheet: number }> = {
  GK: { goal: 2, cleanSheet: 0.8 },
  RB: { goal: 1.5, cleanSheet: 0.6 }, CB: { goal: 1.5, cleanSheet: 0.6 },
  LB: { goal: 1.5, cleanSheet: 0.6 }, RWB: { goal: 1.5, cleanSheet: 0.6 },
  LWB: { goal: 1.5, cleanSheet: 0.6 },
  DM: { goal: 1.2, cleanSheet: 0.2 }, CM: { goal: 1.2, cleanSheet: 0.2 },
  AM: { goal: 1.2, cleanSheet: 0.2 },
  RW: { goal: 1, cleanSheet: 0 }, LW: { goal: 1, cleanSheet: 0 },
  ST: { goal: 1, cleanSheet: 0 },
};

const clamp = (value: number): number => Math.min(10, Math.max(1, value));

export function minutesCoefficient(minutes: number): number {
  if (minutes <= 0) return 0;
  if (minutes < 10) return 0.1;
  if (minutes < 30) return 0.4;
  if (minutes < 60) return 0.7;
  return 1;
}

export function calculatePlayerRating(
  input: PlayerRatingInput,
  config: Partial<RatingConfig> = DEFAULT_RATING_CONFIG,
): PlayerRatingResult {
  const minimumVotes = config.minimumVotes ?? DEFAULT_RATING_CONFIG.minimumVotes;
  const roleWeights = config.roleWeights ?? DEFAULT_RATING_CONFIG.roleWeights;
  if (!Number.isSafeInteger(minimumVotes) || minimumVotes < 1) {
    throw new RangeError("minimumVotes must be a positive integer.");
  }
  const details: RatingDetails = {
    player_id: input.player_id, panel_average: null,
    statistical_score: null, vote_count: input.votes.length,
  };
  const invalid = (): PlayerRatingResult => ({
    ...details, status: "invalid_data", reason: "Datos de posición, estadísticas o votos no válidos.", final_rating: null,
  });
  const counts = [input.minutes_played, input.goals, input.assists, input.yellow_cards, input.red_cards];
  if (!input.player_id || counts.some(value => !Number.isSafeInteger(value) || value < 0) || typeof input.clean_sheet !== "boolean") return invalid();
  let weightedTotal = 0;
  let totalWeight = 0;
  for (const vote of input.votes) {
    const weight = Object.prototype.hasOwnProperty.call(roleWeights, vote.voter_role) ? roleWeights[vote.voter_role] : 1;
    if (!Number.isFinite(vote.score) || vote.score < 1 || vote.score > 10 || !Number.isFinite(weight) || weight <= 0) return invalid();
    weightedTotal += vote.score * weight;
    totalWeight += weight;
  }
  if (!Number.isFinite(weightedTotal) || !Number.isFinite(totalWeight)) return invalid();
  details.panel_average = totalWeight > 0 ? weightedTotal / totalWeight : null;
  if (input.minutes_played === 0) return {
    ...details, status: "no_minutes", reason: "Sin minutos jugados.", final_rating: null,
  };
  if (!input.position || !Object.prototype.hasOwnProperty.call(modifiers, input.position)) return invalid();
  const position = modifiers[input.position];
  const delta = input.goals * position.goal + input.assists * 0.5
    + (input.clean_sheet ? position.cleanSheet : 0)
    - input.yellow_cards * 0.3 - input.red_cards * 1.5;
  details.statistical_score = clamp(6 + minutesCoefficient(input.minutes_played) * delta);
  if (details.panel_average === null || details.vote_count < minimumVotes) return {
    ...details, status: "insufficient_votes", reason: `Votos insuficientes: ${details.vote_count} de ${minimumVotes} requeridos.`, final_rating: null,
  };
  return {
    ...details, status: "rated", reason: null,
    final_rating: clamp(0.7 * details.panel_average + 0.3 * details.statistical_score),
  };
}

export function selectMatchMvp(results: readonly PlayerRatingResult[]): MatchMvpResult {
  let best: RatedPlayer[] = [];
  for (const result of results) {
    if (result.status !== "rated") continue;
    if (best.length === 0 || result.final_rating > best[0].final_rating) best = [result];
    else if (result.final_rating === best[0].final_rating) best.push(result);
  }
  // Presentation ordering only: every tied player remains an MVP.
  best.sort((a, b) => a.player_id < b.player_id ? -1 : a.player_id > b.player_id ? 1 : 0);
  return {
    status: best.length === 0 ? "none" : best.length === 1 ? "single" : "shared",
    players: best,
    final_rating: best[0]?.final_rating ?? null,
  };
}
