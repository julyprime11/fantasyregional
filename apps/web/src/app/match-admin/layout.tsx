import type {
  ReactNode,
} from "react";

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
  canAccessMatchAdmin,
} from "@/lib/roles";

export default async function MatchAdminLayout({
  children,
}: {
  children: ReactNode;
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
    !profile ||
    !canAccessMatchAdmin(
      profile.voter_role,
    )
  ) {
    redirect(
      "/post-login",
    );
  }

  return children;
}