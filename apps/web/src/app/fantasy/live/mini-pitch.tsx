import {
  getFantasyLine,
  PLAYER_POSITIONS,
  type PlayerPosition,
} from "@regional-fantasy/shared";

export type MiniPitchPlayer = {
  id: string;
  name: string;
  position: string;
  shirtNumber: number | null;
  isPlaying: boolean;
  captain?: boolean;
  /** Null cuando no hay una posición válida para calcular puntos. */
  points?: number | null;
};

type Line = "GK" | "DEF" | "MID" | "FWD";
const LINES: readonly Line[] = ["FWD", "MID", "DEF", "GK"];

function getLine(position: string): Line | null {
  return PLAYER_POSITIONS.includes(position as PlayerPosition)
    ? getFantasyLine(position as PlayerPosition)
    : null;
}

function shortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return parts.length > 1 ? parts.slice(-1)[0] : (parts[0] ?? "Jugador");
}

export default function MiniPitch({
  title,
  players,
  showLiveState = false,
  totalPoints,
}: {
  title: string;
  players: readonly MiniPitchPlayer[];
  showLiveState?: boolean;
  totalPoints?: number | null;
}) {
  const grouped = Object.fromEntries(
    LINES.map((line) => [
      line,
      players.filter((player) => getLine(player.position) === line),
    ]),
  ) as Record<Line, MiniPitchPlayer[]>;

  const unknown = players.filter((player) => getLine(player.position) === null);

  return (
    <section
      aria-label={title}
      className="min-w-0 rounded-[1rem] bg-white p-1.5 shadow-sm ring-1 ring-black/5"
    >
      <div className="flex min-h-8 items-center justify-between gap-1 px-1">
        <h2 className="truncate text-[10px] font-black uppercase tracking-wide text-[#0f3d2e]">
          {title}
        </h2>
        <div className="flex shrink-0 items-center gap-1.5">
          <span className="text-[9px] font-bold text-zinc-400">{players.length}/11</span>
          {totalPoints !== undefined && (
            <span className="rounded-md bg-[#e8f2ed] px-1.5 py-1 text-[10px] font-black tabular-nums text-[#0f3d2e]">
              {totalPoints === null ? "—" : totalPoints > 0 ? `+${totalPoints}` : totalPoints} pts
            </span>
          )}
        </div>
      </div>

      <div
        className="relative aspect-[168/270] overflow-hidden rounded-[0.7rem] border border-white/40 bg-[#087443]"
        aria-label={title + ": " + players.length + " jugadores por posiciones"}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-55"
          style={{
            backgroundImage:
              "linear-gradient(90deg,rgba(255,255,255,.055) 50%,transparent 50%)",
            backgroundSize: "32px 32px",
          }}
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-1 rounded-md border border-white/45">
          <div className="absolute left-0 right-0 top-1/2 border-t border-white/50" />
          <div className="absolute left-1/2 top-1/2 size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/50" />
          <div className="absolute left-1/2 top-0 h-7 w-14 -translate-x-1/2 border-x border-b border-white/50" />
          <div className="absolute bottom-0 left-1/2 h-7 w-14 -translate-x-1/2 border-x border-t border-white/50" />
        </div>

        <div className="relative z-10 flex h-full flex-col justify-around gap-1 px-0.5 py-3">
          {LINES.map((line) => (
            <div key={line} className="flex min-h-0 flex-1 items-center justify-around gap-px">
              {grouped[line].length === 0 ? (
                <span aria-hidden="true" className="text-[8px] font-bold text-white/35">
                  {line}
                </span>
              ) : (
                grouped[line].map((player) => (
                  <div
                    key={player.id}
                    title={
                      player.name +
                      (player.captain ? " · Capitán" : "") +
                      (showLiveState ? (player.isPlaying ? " · En campo" : " · Fuera del campo") : "") +
                      (player.points !== undefined ? ` · ${player.points ?? "Sin"} puntos provisionales` : "")
                    }
                    className="flex min-w-0 flex-1 flex-col items-center gap-0.5"
                    aria-label={
                      player.name + ", " + line +
                      (player.captain ? ", capitán Fantasy" : "") +
                      (showLiveState ? (player.isPlaying ? ", en campo" : ", fuera del campo") : "") +
                      (player.points !== undefined ? `, ${player.points ?? "sin"} puntos provisionales` : "")
                    }
                  >
                    <div
                      className={
                        "relative flex size-[clamp(16px,4.1vw,23px)] shrink-0 items-center justify-center rounded-full border text-[8px] font-black tabular-nums shadow-sm " +
                        (showLiveState && !player.isPlaying
                          ? "border-white/65 bg-zinc-500 text-white"
                          : "border-white bg-[#0f3d2e] text-white")
                      }
                    >
                      {player.shirtNumber ?? "·"}
                      {player.captain && (
                        <span className="absolute -right-1.5 -top-1.5 flex h-3 w-3 items-center justify-center rounded-full bg-amber-300 text-[7px] font-black text-zinc-950">
                          C
                        </span>
                      )}
                    </div>
                    <span className="w-full truncate px-px text-center text-[clamp(6px,1.65vw,9px)] font-bold leading-3 text-white">
                      {shortName(player.name)}
                    </span>
                    {player.points !== undefined && (
                      <span
                        className={
                          "min-w-5 rounded px-1 py-0.5 text-center text-[9px] font-black leading-3 tabular-nums " +
                          (player.points === null
                            ? "bg-zinc-200 text-zinc-600"
                            : player.points < 0
                              ? "bg-red-100 text-red-800"
                              : "bg-white text-[#0f3d2e]")
                        }
                      >
                        {player.points === null ? "—" : player.points > 0 ? `+${player.points}` : player.points}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          ))}
        </div>
      </div>

      {unknown.length > 0 && (
        <p className="mt-1 px-1 text-[9px] leading-3 text-amber-700">
          {unknown.length} jugador(es) sin posición reconocida
        </p>
      )}
    </section>
  );
}
