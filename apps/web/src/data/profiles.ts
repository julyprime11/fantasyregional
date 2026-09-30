import "server-only";

import type { Database } from "@/lib/supabase/database.types";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export type ProfileRow =
  Database["public"]["Tables"]["profiles"]["Row"];

export async function getProfiles(): Promise<ProfileRow[]> {
  const supabase =
    await createServerSupabaseClient();

  const { data, error } =
    await supabase
      .from("profiles")
      .select("*")
      .order("display_name")
      .order("id");

  if (error) {
    throw error;
  }

  return data;
}

export async function updateProfileVoterRole(
  profileId: string,
  voterRole: string | null,
): Promise<void> {
  const supabase =
    await createServerSupabaseClient();

  const { error } =
    await supabase
      .from("profiles")
      .update({
        voter_role: voterRole,
      })
      .eq("id", profileId)
      .select("id")
      .single();

  if (error) {
    throw error;
  }
}