"use client";

import {
  useEffect,
  useState,
} from "react";

function formatRemaining(
  remainingMs: number,
): string {
  if (remainingMs <= 0) {
    return "Cierre alcanzado";
  }

  const totalMinutes =
    Math.max(
      1,
      Math.ceil(
        remainingMs /
          60_000,
      ),
    );

  const days =
    Math.floor(
      totalMinutes /
        (24 * 60),
    );

  const hours =
    Math.floor(
      (totalMinutes %
        (24 * 60)) /
        60,
    );

  const minutes =
    totalMinutes %
    60;

  if (days > 0) {
    return `Cierra en ${days} d ${hours} h`;
  }

  if (hours > 0) {
    return `Cierra en ${hours} h ${minutes} min`;
  }

  return `Cierra en ${minutes} min`;
}

export default function LineupCountdown({
  lockAt,
  fallbackLabel,
}: {
  lockAt: number;
  fallbackLabel: string;
}) {
  const [
    now,
    setNow,
  ] =
    useState<number | null>(
      null,
    );

  useEffect(() => {
    const updateNow = () =>
      setNow(
        Date.now(),
      );

    updateNow();

    const timer =
      window.setInterval(
        updateNow,
        60_000,
      );

    return () =>
      window.clearInterval(
        timer,
      );
  }, []);

  return (
    <p className="mt-2 text-sm font-black text-[#0b2f23]">
      {now === null
        ? fallbackLabel
        : formatRemaining(
            lockAt -
              now,
          )}
    </p>
  );
}
