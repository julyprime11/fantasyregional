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
  getFantasyLeagueById,
  getUserFantasyLeagues,
} from "@/data/fantasy-leagues";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

import {
  canPlayFantasy,
  canVote,
} from "@/lib/roles";

import FantasyBottomNav from "./fantasy-bottom-nav";

export default async function FantasyLayout({
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
    error:
      profileError,
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
    profileError ||
    !profile
  ) {
    redirect("/");
  }

  if (
    !canPlayFantasy(
      profile.voter_role,
    )
  ) {
    redirect(
      "/post-login",
    );
  }

  const memberships =
    await getUserFantasyLeagues(
      user.id,
    );

  const leagues = (
    await Promise.all(
      memberships.map(
        (membership) =>
          getFantasyLeagueById(
            membership.league_id,
          ),
      ),
    )
  ).filter(
    (
      league,
    ): league is NonNullable<
      Awaited<
        ReturnType<
          typeof getFantasyLeagueById
        >
      >
    > =>
      league !== null,
  );

  const defaultLeagueId =
    leagues[0]?.id ??
    null;

  return (
    <div className="min-h-screen bg-[#f2f4f2]">
      <div className="pb-24">
        {children}
      </div>

      <FantasyBottomNav
        defaultLeagueId={
          defaultLeagueId
        }
        showVoting={
          canVote(
            profile.voter_role,
          )
        }
      />
    </div>
  );
}