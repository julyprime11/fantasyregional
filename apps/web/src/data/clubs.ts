import "server-only";
import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";
export type ClubRow = Database["public"]["Tables"]["clubs"]["Row"];
export async function getClubs(): Promise<ClubRow[]> {
  const { data, error } = await createServerSupabaseClient().from("clubs").select("*").order("name").order("id");
  if (error) throw error;
  return data;
}
export async function createClub(input: Database["public"]["Tables"]["clubs"]["Insert"]): Promise<void> {
  const { error } = await createServerSupabaseClient().from("clubs").insert(input);
  if (error) throw error;
}
