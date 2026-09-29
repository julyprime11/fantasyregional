import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type CompetitionRow = Database["public"]["Tables"]["competitions"]["Row"];

export async function getCompetitions(): Promise<CompetitionRow[]> {
  const { data, error } = await createServerSupabaseClient()
    .from("competitions").select("*").order("name").order("id");
  if (error) throw error;
  return data;
}
