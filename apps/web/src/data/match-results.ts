import "server-only";
import { calculatePlayerRating, selectMatchMvp, getResultsPhase, DEFAULT_RATING_CONFIG, type RatingConfig, type ResultsPhase, type MatchMvpResult, type PanelVote, type PlayerRatingResult } from "@regional-fantasy/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMatchById, type MatchRow } from "./matches";
import { getMatchPlayers, type MatchPlayerDetails } from "./match-players";

type ResultRow = { entry: MatchPlayerDetails; rating: PlayerRatingResult };
export type MatchResults =
  | { status: "not_found" }
  | { status: "not_ready"; match: MatchRow }
  | { status: "ready"; phase: ResultsPhase; minimumVotes: number; match: MatchRow; rows: ResultRow[]; mvp: MatchMvpResult };

export async function getMatchResults(matchId: string, config: Partial<RatingConfig> = DEFAULT_RATING_CONFIG): Promise<MatchResults> {
  const match = await getMatchById(matchId);
  if (!match) return { status: "not_found" };
  const phase = getResultsPhase(match.status);
  if (phase === null) return { status: "not_ready", match };
  const squad = await getMatchPlayers(matchId);
  const client = createServerSupabaseClient();
  const votes = new Map<string, PanelVote[]>();
  // Paginate to avoid silently averaging only the first API page of votes.
  const pageSize = 500;
  let offset = 0;
  while (true) {
    const { data, error } = await client.from("ratings")
      .select("player_id, score, voter_role").eq("match_id", matchId)
      .order("id").range(offset, offset + pageSize - 1);
    if (error) throw error;
    if (data.length === 0) break;
    for (const vote of data) {
      const existing = votes.get(vote.player_id) ?? [];
      existing.push({ score: vote.score, voter_role: vote.voter_role });
      votes.set(vote.player_id, existing);
    }
    offset += data.length;
  }
  const rows = squad.map(entry => ({
    entry,
    rating: calculatePlayerRating({
      player_id: entry.player_id, position: entry.player?.position ?? null,
      minutes_played: entry.minutes_played, goals: entry.goals, assists: entry.assists,
      yellow_cards: entry.yellow_cards, red_cards: entry.red_cards, clean_sheet: entry.clean_sheet,
      votes: votes.get(entry.player_id) ?? [],
    }, config),
  }));
  return { status: "ready", phase, minimumVotes: config.minimumVotes ?? DEFAULT_RATING_CONFIG.minimumVotes, match, rows, mvp: selectMatchMvp(rows.map(row => row.rating)) };
}
