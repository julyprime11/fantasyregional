import Link from "next/link";

import { getFantasyMatchPoints } from "@/data/fantasy-match-points";
import type { FantasyMatchday } from "@/data/fantasy-matchdays";
import type { FantasyStandingEntry } from "@/data/fantasy-standings";

type Props = {
  leagueId: string;
  userId: string;
  matchdays: readonly FantasyMatchday[];
  standings: readonly FantasyStandingEntry[];
};

export default async function LatestMatchdaySummary({
  leagueId,
  userId,
  matchdays,
  standings,
}: Props) {
  // matchdays ya está ordenado por fecha descendente.
  const latest = matchdays.find(
    (matchday) => matchday.points_status === "ready",
  );

  if (!latest) {
    return null;
  }

  // Solo consultamos el detalle cuando el usuario presentó un XI.
  const result =
    latest.lineup_status === "submitted"
      ? await getFantasyMatchPoints({
          leagueId,
          userId,
          matchId: latest.match_id,
        })
      : null;

  const bestPlayer =
    result?.status === "ready"
      ? [...result.players]
          .filter((player) => player.minutes_played > 0)
          .sort((a, b) => b.points - a.points)[0] ?? null
      : null;

  const standing =
    standings.find((entry) => entry.user_id === userId) ?? null;

  const date = new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
    timeZone: "Europe/Madrid",
  }).format(new Date(latest.match_date));

  const score =
    latest.home_score !== null && latest.away_score !== null
      ? `${latest.home_score} - ${latest.away_score}`
      : "vs";

  const positionChange = standing?.position_change ?? null;

  return (
    <section
      aria-labelledby="latest-matchday-title"
      className="mt-5 overflow-hidden rounded-[1.3rem] bg-white shadow-sm ring-1 ring-black/5"
    >
      <div className="flex items-center justify-between gap-3 bg-[#0f3d2e] px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/55">
            Última jornada · {date}
          </p>
          <h2 id="latest-matchday-title" className="mt-1 text-base font-black">
            Tu resultado Fantasy
          </h2>
        </div>

        <div className="shrink-0 text-right">
          <p className="text-2xl font-black leading-none">
            {latest.total_points ?? 0}
            <span className="ml-1 text-xs text-white/60">pts</span>
          </p>
        </div>
      </div>

      <div className="px-4 py-3">
        <p className="text-xs font-black leading-5 text-zinc-950">
          {latest.home_team_name}
          <span className="mx-2 whitespace-nowrap text-zinc-400">
            {score}
          </span>
          {latest.away_team_name}
        </p>

        {latest.lineup_status === "missing" ? (
          <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-700">
            No presentaste un XI en esta jornada: 0 puntos.
          </p>
        ) : bestPlayer ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#e8f2ed] px-3 py-3">
            <div className="min-w-0">
              <p className="text-[9px] font-black uppercase tracking-wide text-[#557368]">
                Mejor de tu XI
              </p>
              <p className="mt-1 truncate text-xs font-black text-[#0b2f23]">
                {bestPlayer.player_name}
              </p>
            </div>
            <p className="shrink-0 text-lg font-black text-[#0f3d2e]">
              {bestPlayer.points}
              <span className="ml-1 text-[9px]">pts</span>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-[11px] text-zinc-500">
            Sin jugadores con minutos disputados.
          </p>
        )}

        {positionChange !== null && (
          <p
            className={`mt-3 text-[11px] font-black ${
              positionChange > 0
                ? "text-emerald-700"
                : positionChange < 0
                  ? "text-red-600"
                  : "text-zinc-500"
            }`}
          >
            {positionChange > 0
              ? `▲ Has subido ${positionChange} ${positionChange === 1 ? "puesto" : "puestos"}`
              : positionChange < 0
                ? `▼ Has bajado ${Math.abs(positionChange)} ${positionChange === -1 ? "puesto" : "puestos"}`
                : "— Mantienes tu posición"}
            {" "}en la clasificación
          </p>
        )}

        <Link
          href={`/fantasy/leagues/${encodeURIComponent(leagueId)}/matches/${encodeURIComponent(latest.match_id)}`}
          className="mt-3 flex min-h-11 items-center justify-center rounded-xl bg-zinc-950 px-3 text-xs font-black text-white transition active:scale-[0.99]"
        >
          Ver puntos de esta jornada →
        </Link>
      </div>
    </section>
  );
}
