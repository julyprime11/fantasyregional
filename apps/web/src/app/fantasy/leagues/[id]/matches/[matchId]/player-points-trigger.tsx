"use client";

import Link from "next/link";
import {
  useId,
  useRef,
} from "react";

import type {
  FantasyMatchPlayerPoints,
} from "@/data/fantasy-match-points";

type Props = {
  player: FantasyMatchPlayerPoints;
  variant: "pitch" | "list";
  position?: number;
};

type PointKey =
  keyof FantasyMatchPlayerPoints["breakdown"];

const POINT_ROWS: ReadonlyArray<{
  key: PointKey;
  label: string;
}> = [
  {
    key: "minutes",
    label: "Minutos jugados",
  },
  {
    key: "goals",
    label: "Goles",
  },
  {
    key: "assists",
    label: "Asistencias",
  },
  {
    key: "clean_sheet",
    label: "Portería a cero",
  },
  {
    key: "goals_conceded",
    label: "Goles encajados",
  },
  {
    key: "cards",
    label: "Tarjetas",
  },
  {
    key: "rating",
    label: "Valoración",
  },
  {
    key: "mvp",
    label: "MVP",
  },
];

function signedPoints(
  points: number,
): string {
  return points > 0
    ? `+${points}`
    : String(points);
}

export default function PlayerPointsTrigger({
  player,
  variant,
  position,
}: Props) {
  const dialogRef =
    useRef<HTMLDialogElement>(null);

  const titleId =
    useId();

  const played =
    player.minutes_played > 0;

  function showBreakdown() {
    const dialog =
      dialogRef.current;

    if (
      dialog &&
      !dialog.open
    ) {
      dialog.showModal();
    }
  }

  return (
    <>
      {variant === "pitch" ? (
        <button
          type="button"
          onClick={showBreakdown}
          aria-haspopup="dialog"
          aria-label={`Ver puntos de ${player.player_name}`}
          className={`flex w-full max-w-[92px] flex-col items-center text-center transition active:scale-95 focus-visible:rounded-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${!played ? "opacity-70" : ""}`}
        >
          <div className="relative">
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-full font-black shadow-md ring-2 ${played ? "bg-white text-[#0f5e3d] ring-white/30" : "bg-zinc-200 text-zinc-500 ring-white/20"}`}
            >
              {player.shirt_number ?? "—"}
            </div>

            <div
              className={`absolute -right-2 -top-2 flex min-h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[9px] font-black shadow ${player.points > 0 ? "bg-zinc-950" : "bg-zinc-600"} text-white`}
            >
              {player.points}
            </div>
          </div>

          <span className="mt-1 max-w-full truncate rounded-md bg-zinc-950/85 px-2 py-1 text-[9px] font-black text-white">
            {player.player_name}
          </span>

          {player.is_captain && <span className="mt-1 text-[9px] font-black text-amber-200">★ Capitán ×2</span>}
          {played ? (
            <span className="mt-1 text-[8px] font-bold text-white/75">
              {player.minutes_played} min
            </span>
          ) : (
            <span className="mt-1 rounded-full bg-white/20 px-2 py-0.5 text-[8px] font-black uppercase text-white">
              No jugó
            </span>
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={showBreakdown}
          aria-haspopup="dialog"
          aria-label={`Ver desglose de puntos de ${player.player_name}`}
          className={`flex w-full items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 text-left transition hover:bg-[#f0f6f3] focus-visible:outline-2 focus-visible:outline-[#0f3d2e] last:border-b-0 ${!played ? "bg-zinc-50/70" : ""}`}
        >
          <div className="flex min-w-0 items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${position === 1 ? "bg-[#0f3d2e] text-white" : "bg-zinc-100 text-zinc-500"}`}
            >
              {position ?? player.shirt_number ?? "—"}
            </span>

            <span className="min-w-0">
              <span className="block truncate text-xs font-black text-zinc-950">
                {player.player_name}
              </span>

              <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] font-semibold text-zinc-400">
                <span>{player.position ?? "—"}</span>
                {player.is_captain && <span className="font-black text-amber-700">★ Capitán ×2</span>}
                <span>·</span>
                {played ? (
                  <span>{player.minutes_played} min</span>
                ) : (
                  <span className="font-black uppercase">No jugó</span>
                )}
                {player.final_rating !== null && (
                  <span>
                    · Nota {player.final_rating.toFixed(2)}
                  </span>
                )}
              </span>
            </span>
          </div>

          <span className="flex shrink-0 items-center gap-2">
            <span className="text-right">
              <span
                className={`block text-lg font-black ${player.points > 0 ? "text-[#0f3d2e]" : player.points < 0 ? "text-red-600" : "text-zinc-400"}`}
              >
                {player.points}
                <span className="ml-1 text-[8px] font-black uppercase text-zinc-400">
                  pts
                </span>
              </span>
              <span className="block text-[8px] font-bold text-[#557368]">
                Ver detalle
              </span>
            </span>
            <span
              aria-hidden="true"
              className="text-sm text-zinc-400"
            >
              ›
            </span>
          </span>
        </button>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        className="fixed inset-0 m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-[1.7rem] bg-white p-0 text-zinc-950 shadow-2xl backdrop:bg-black/70"
      >
        <div className="bg-[#0f3d2e] px-5 pb-5 pt-5 text-white">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
                Desglose Fantasy
              </p>
              <h2
                id={titleId}
                className="mt-1 text-xl font-black leading-tight"
              >
                {player.player_name}
              </h2>
              <p className="mt-1 text-xs font-semibold text-white/65">
                {player.position ?? "Jugador"} ·{" "}
                {played
                  ? `${player.minutes_played} minutos`
                  : "No jugó"}
              </p>
            </div>

            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Cerrar desglose"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-bold text-white transition hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-white"
            >
              ×
            </button>
          </div>

          <div className="mt-5 flex items-end justify-between border-t border-white/15 pt-4">
            <span className="text-sm font-bold text-white/70">
              Total para tu XI
            </span>
            <span className="text-3xl font-black">
              {player.points}
              <span className="ml-1 text-xs font-black text-white/60">
                pts
              </span>
            </span>
          </div>
        </div>

        <div className="px-5 pb-5 pt-4">
          <p className="mb-3 text-[10px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Cómo se han calculado
          </p>

          <div className="divide-y divide-zinc-100 rounded-[1.1rem] border border-zinc-100">
            {POINT_ROWS.map(({ key, label }) => {
              const points =
                player.breakdown[key];

              return (
                <div
                  key={key}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-zinc-900">
                      {label}
                    </p>

                    {key === "minutes" && (
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {player.minutes_played} min
                      </p>
                    )}

                    {key === "rating" && (
                      <p className="mt-0.5 text-[10px] text-zinc-500">
                        {player.final_rating === null
                          ? "Sin valoración válida"
                          : `Nota ${player.final_rating.toFixed(2)} · redondeada a ${player.rounded_rating ?? "—"}`}
                      </p>
                    )}
                  </div>

                  <p
                    className={`shrink-0 text-sm font-black ${points > 0 ? "text-[#0f3d2e]" : points < 0 ? "text-red-600" : "text-zinc-400"}`}
                  >
                    {signedPoints(points)}
                  </p>
                </div>
              );
            })}
          </div>

          {player.is_captain && (
            <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 text-amber-900">
              <span className="text-xs font-black">★ Capitán ×2 · Base {player.base_points} pts</span>
              <span className="text-sm font-black">Bonus {player.captain_bonus} pts</span>
            </div>
          )}
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[#e8f2ed] px-4 py-3">
            <span className="text-sm font-black text-[#0b2f23]">
              Total Fantasy
            </span>
            <span className="text-xl font-black text-[#0f3d2e]">
              {player.points} pts
            </span>
          </div>

          <Link
            href={`/players/${player.player_id}`}
            className="mt-4 flex min-h-11 items-center justify-center rounded-xl border border-[#d7e8df] text-xs font-black text-[#0f3d2e]"
          >
            Ver ficha del jugador →
          </Link>
        </div>
      </dialog>
    </>
  );
}
