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

/**
 * La Directiva puede gestionar la aplicación, pero consultar correos
 * privados de todos los participantes exige, además, autorización
 * de plataforma en app_metadata (no editable por el propio usuario).
 *
 * Se verifica en servidor sobre auth.getUser(), nunca desde el navegador.
 */
export async function currentUserCanReviewLeagueEmails(): Promise<boolean> {
  const user = await requireUser();

  if (!(await currentUserIsAdmin())) {
    return false;
  }

  return user.app_metadata?.platform_admin === true;
}
