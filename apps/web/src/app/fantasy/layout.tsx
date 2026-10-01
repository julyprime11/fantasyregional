import type {
  ReactNode,
} from "react";

import {
  requireUser,
} from "@/lib/auth";

import {
  getFantasyLeagueById,
  getUserFantasyLeagues,
} from "@/data/fantasy-leagues";

import FantasyBottomNav from "./fantasy-bottom-nav";

export default async function FantasyLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user =
    await requireUser();

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
      />
    </div>
  );
}