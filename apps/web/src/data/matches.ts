import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type MatchRow =
  Database["public"]["Tables"]["matches"]["Row"];

type MatchInsert =
  Database["public"]["Tables"]["matches"]["Insert"];

type MatchUpdate = Pick<
  Database["public"]["Tables"]["matches"]["Update"],
  | "competition_id"
  | "home_team_id"
  | "away_team_id"
  | "match_date"
  | "home_score"
  | "away_score"
  | "status"
  | "voting_opens_at"
  | "voting_closes_at"
>;

export async function getMatches(): Promise<MatchRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("matches")
      .select("*")
      .order("match_date", {
        ascending: false,
      })
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function getMatchById(
  id: string,
): Promise<MatchRow | null> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("matches")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

export async function createMatch(
  input: MatchInsert,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("matches")
      .insert(input);

  if (error) {
    throw error;
  }
}

export async function updateMatch(
  id: string,
  input: MatchUpdate,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("matches")
      .update(input)
      .eq("id", id)
      .select("id")
      .single();

  if (error) {
    throw error;
  }
}