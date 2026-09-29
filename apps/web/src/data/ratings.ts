import "server-only";
import { InputError, parseMatchId, parseRatingInput } from "@regional-fantasy/shared";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isDevelopmentVotingEnabled } from "@/lib/development-voting";
import { getMatchById } from "./matches";
import { getMatchPlayers } from "./match-players";

export async function submitMatchRatings(matchId: string, raw: Record<string, unknown>): Promise<number> {
  if (!isDevelopmentVotingEnabled()) throw new InputError("La votación temporal solo está disponible en desarrollo.");
  const id = parseMatchId(matchId);
  const input = parseRatingInput(raw);
  const squad = await getMatchPlayers(id);
  const playerIds = new Set(squad.map(entry => entry.player_id));
  if (input.votes.some(vote => !playerIds.has(vote.player_id))) {
    throw new InputError("Solo puedes votar a jugadores de la convocatoria actual. Recarga la página.");
  }
  // Check current status at submission time, not just when rendering the page.
  const match = await getMatchById(id);
  if (!match || match.status !== "voting") throw new InputError("La votación de este partido no está abierta.");

  const rows: Database["public"]["Tables"]["ratings"]["Insert"][] = input.votes.map(vote => ({
    match_id: id, player_id: vote.player_id, voter_id: input.voter_id,
    voter_role: input.voter_role, score: vote.score,
  }));
  // One INSERT statement: a constraint failure rejects the whole batch. Never upsert votes.
  const { error } = await createServerSupabaseClient().from("ratings").insert(rows);
  if (error?.code === "23505") {
    throw new InputError("Ya has votado a uno o más de estos jugadores. No se guardó ningún voto de este envío. Deja en blanco los jugadores ya votados.");
  }
  if (error) throw error;
  return rows.length;
}
