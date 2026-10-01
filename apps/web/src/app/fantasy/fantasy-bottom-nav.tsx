"use client";

import Link from "next/link";

import {
  usePathname,
  useSearchParams,
} from "next/navigation";

export default function FantasyBottomNav({
  defaultLeagueId,
}: {
  defaultLeagueId:
    | string
    | null;
}) {
  const pathname =
    usePathname();

  const searchParams =
    useSearchParams();

  const queryLeagueId =
    searchParams.get(
      "league",
    );

  const activeLeagueId =
    queryLeagueId ??
    defaultLeagueId;

  const homeHref =
    activeLeagueId
      ? `/fantasy?league=${encodeURIComponent(
          activeLeagueId,
        )}`
      : "/fantasy";

  const lineupHref =
    activeLeagueId
      ? `/fantasy/leagues/${encodeURIComponent(
          activeLeagueId,
        )}/lineup`
      : "/fantasy/leagues";

  const items = [
    {
      href:
        homeHref,
      label:
        "Inicio",
      icon:
        "⌂",
      active:
        pathname ===
        "/fantasy",
    },

    {
      href:
        "/fantasy/leagues",
      label:
        "Ligas",
      icon:
        "🏆",
      active:
        pathname ===
          "/fantasy/leagues" ||
        pathname ===
          "/fantasy/leagues/create" ||
        pathname ===
          "/fantasy/leagues/join",
    },

    {
      href:
        lineupHref,
      label:
        "Mi XI",
      icon:
        "⚽",
      active:
        pathname.endsWith(
          "/lineup",
        ),
    },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 border-t border-zinc-200 bg-white/95 px-5 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 backdrop-blur">
      <div className="grid grid-cols-3">
        {items.map(
          (item) => (
            <Link
              key={
                item.label
              }
              href={
                item.href
              }
              className={`flex flex-col items-center gap-1 ${
                item.active
                  ? "text-[#0f3d2e]"
                  : "text-zinc-400"
              }`}
            >
              <span className="text-xl">
                {
                  item.icon
                }
              </span>

              <span className="text-[10px] font-black">
                {
                  item.label
                }
              </span>
            </Link>
          ),
        )}
      </div>
    </nav>
  );
}