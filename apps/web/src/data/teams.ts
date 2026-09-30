import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type TeamRow =
  Database["public"]["Tables"]["teams"]["Row"];

export async function getTeams(): Promise<TeamRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("teams")
      .select("*")
      .order("name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function createTeam(
  input: Database["public"]["Tables"]["teams"]["Insert"],
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("teams")
      .insert(input);

  if (error) {
    throw error;
  }
}