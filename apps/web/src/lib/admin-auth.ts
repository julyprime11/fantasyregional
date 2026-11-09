import "server-only";

import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/roles";

export async function currentUserIsAdmin(): Promise<boolean> {
  const user = await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
    error,
  } = await supabase
    .from("profiles")
    .select("voter_role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return false;
  }

  return isAdminRole(
    profile.voter_role,
  );
}