"use client";

import { useEffect, useState } from "react";

import type { LiveMatchPhase } from "@/data/matches";
import { calculateLiveClockSeconds, formatLiveClock } from "@/lib/live-match-clock";

type Props = {
  phase: LiveMatchPhase;
  clockSeconds: number;
  clockStartedAt: string | null;
};

/** Solo presenta el reloj; Match Admin y la BD controlan su estado. */
export default function FantasyLiveClock({ phase, clockSeconds, clockStartedAt }: Props) {
  // La primera renderizacion debe coincidir con el HTML del servidor.
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const updateClock = () => setNowMs(Date.now());
    updateClock();
    if (phase !== "first_half" && phase !== "second_half") return;

    const interval = window.setInterval(updateClock, 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") updateClock();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [phase, clockSeconds, clockStartedAt]);

  const seconds = nowMs === null
    ? clockSeconds
    : calculateLiveClockSeconds(phase, clockSeconds, clockStartedAt, nowMs);

  const running = phase === "first_half" || phase === "second_half";

  return (
    <div className="flex items-center justify-center gap-2" aria-label="Cronometro del partido">
      {running && <span aria-hidden="true" className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-600" />}
      <span className="font-mono text-lg font-black tabular-nums tracking-tight text-[#0f3d2e]">
        {formatLiveClock(seconds)}
      </span>
      {phase === "halftime" && <span className="text-[10px] font-bold text-zinc-500">Pausado</span>}
    </div>
  );
}
