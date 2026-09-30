import type { ReactNode } from "react";

import FantasyBottomNav from "./fantasy-bottom-nav";

export default function FantasyLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f2f4f2]">
      <div className="pb-24">
        {children}
      </div>

      <FantasyBottomNav />
    </div>
  );
}