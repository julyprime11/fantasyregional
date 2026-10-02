import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type PlayerRow =
  Database["public"]["Tables"]["players"]["Row"];

export async function getPlayerById(
  id: string,
): Promise<PlayerRow | null> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("players")
      .select("*")
      .eq("id", id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

type PlayerUpdate = Pick<
  Database["public"]["Tables"]["players"]["Update"],
  | "first_name"
  | "last_name"
  | "shirt_number"
  | "position"
  | "image_url"
  | "active"
  | "team_id"
  | "ffcv_player_code"
  | "ffcv_last_sync_at"
>;

export async function updatePlayer(
  id: string,
  input: PlayerUpdate,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("players")
      .update(input)
      .eq("id", id)
      .select("id")
      .single();

  // single() también rechaza actualizaciones
  // que no hayan encontrado ningún jugador.
  if (error) {
    throw error;
  }
}

export async function getPlayers(): Promise<PlayerRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("players")
      .select("*")
      .order("first_name")
      .order("last_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function getPlayersByTeam(
  teamId: string,
): Promise<PlayerRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("players")
      .select("*")
      .eq("team_id", teamId)
      .order("first_name")
      .order("last_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function createPlayer(
  input: Database["public"]["Tables"]["players"]["Insert"],
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("players")
      .insert(input);

  if (error) {
    throw error;
  }
}