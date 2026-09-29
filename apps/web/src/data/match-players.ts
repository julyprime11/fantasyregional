import "server-only";
import { InputError } from "@regional-fantasy/shared";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getMatchById, type MatchRow } from "./matches";
import type { PlayerRow } from "./players";
import type { TeamRow } from "./teams";

export type MatchPlayerRow = Database["public"]["Tables"]["match_players"]["Row"];
export type MatchPlayerDetails = MatchPlayerRow & {
  player: Pick<PlayerRow, "id" | "first_name" | "last_name" | "shirt_number" | "position"> | null;
  team: Pick<TeamRow, "id" | "name"> | null;
};
type Stats = Pick<MatchPlayerRow, "starter" | "minutes_played" | "goals" | "assists" | "yellow_cards" | "red_cards" | "clean_sheet">;

function eligiblePlayersQuery(match: MatchRow) {
  return createServerSupabaseClient().from("players").select("*")
    .eq("active", true).in("team_id", [match.home_team_id, match.away_team_id]);
}

export async function getEligibleSquadPlayers(match: MatchRow): Promise<PlayerRow[]> {
  const { data, error } = await eligiblePlayersQuery(match).order("first_name").order("last_name").order("id");
  if (error) throw error;
  return data;
}

export async function getMatchPlayers(matchId: string): Promise<MatchPlayerDetails[]> {
  const { data, error } = await createServerSupabaseClient().from("match_players")
    .select("*, player:players(id, first_name, last_name, shirt_number, position), team:teams(id, name)")
    .eq("match_id", matchId).order("created_at").order("id");
  if (error) throw error;
  return data;
}

export async function addMatchPlayer(matchId: string, playerId: string): Promise<void> {
  const match = await getMatchById(matchId);
  if (!match) throw new InputError("El partido ya no está disponible.");
  // Recheck eligibility at submission time; never trust a submitted team ID.
  const { data: player, error: playerError } = await eligiblePlayersQuery(match).eq("id", playerId).maybeSingle();
  if (playerError) throw playerError;
  if (!player) throw new InputError("Selecciona un jugador activo de uno de los equipos del partido.");
  const { error } = await createServerSupabaseClient().from("match_players")
    .insert({ match_id: match.id, player_id: player.id, team_id: player.team_id });
  if (error?.code === "23505") throw new InputError("Este jugador ya está en la convocatoria del partido.");
  if (error) throw error;
}

export async function updateMatchPlayerStats(matchId: string, entryId: string, stats: Stats): Promise<void> {
  const { error } = await createServerSupabaseClient().from("match_players")
    .update(stats).eq("match_id", matchId).eq("id", entryId).select("id").single();
  if (error) throw error;
}

export async function removeMatchPlayer(matchId: string, entryId: string): Promise<void> {
  const { error } = await createServerSupabaseClient().from("match_players")
    .delete().eq("match_id", matchId).eq("id", entryId).select("id").single();
  if (error) throw error;
}
