import {
  redirect,
} from "next/navigation";

import {
  requireUser,
} from "@/lib/auth";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  getRolePermissions,
} from "@/lib/roles";

export default async function PostLoginPage() {
  const user =
    await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
    error,
  } =
    await supabase
      .from(
        "profiles",
      )
      .select(
        "voter_role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  if (
    error ||
    !profile
  ) {
    redirect(
      "/access-pending",
    );
  }

  const permissions =
    getRolePermissions(
      profile.voter_role,
    );

  /*
   * Jugador Fantasy
   * Jugador equipo
   * Directiva
   */
  if (
    permissions.canPlayFantasy
  ) {
    redirect(
      "/fantasy",
    );
  }

  /*
   * Entrenador
   * Cuerpo técnico
   */
  if (
    permissions.canVote
  ) {
    redirect(
      "/matches",
    );
  }

  /*
   * Usuario autenticado pero
   * todavía sin rol válido.
   */
  redirect(
    "/access-pending",
  );
}