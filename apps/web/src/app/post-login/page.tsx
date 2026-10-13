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

import {
  getSafeLeagueInvitePath,
} from "@/lib/invite-redirect";

export default async function PostLoginPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
  }>;
}) {
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

  const query =
    await searchParams;

  const invitePath =
    getSafeLeagueInvitePath(
      typeof query.next === "string"
        ? query.next
        : null,
    );

  if (
    invitePath &&
    permissions.canJoinLeague
  ) {
    redirect(invitePath);
  }

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