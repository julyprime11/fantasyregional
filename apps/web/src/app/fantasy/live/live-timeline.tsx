import { FANTASY_EXTRA_STATS, type FantasyExtraStatField } from "@regional-fantasy/shared";
import type { MatchEvent } from "@/data/match-events";

type HistoricalStat = {
  playerId: string;
  field: FantasyExtraStatField;
  count: number;
};

type Props = {
  historicalStats?: readonly HistoricalStat[];
  events: readonly MatchEvent[];
  playerNames: Readonly<Record<string, string>>;
  teamNames: Readonly<Record<string, string>>;
};

function eventLabel(event: MatchEvent): {
  icon: string;
  title: string;
  secondary?: string;
} {
  switch (event.event_type) {
    case "goal":
      return {
        icon: "⚽",
        title: event.is_own_goal ? "Gol en propia puerta" : "Gol",
        secondary: event.scoring_team_id
          ? "Marcador actualizado"
          : undefined,
      };
    case "assist":
      return { icon: "👟", title: "Asistencia" };
    case "yellow_card":
      return { icon: "🟨", title: "Tarjeta amarilla" };
    case "red_card":
      return { icon: "🟥", title: "Tarjeta roja" };
    case "substitution":
      return { icon: "🔄", title: "Sustitución" };
    default: {
      const stat = FANTASY_EXTRA_STATS.find(
        (item) => item.field === event.event_type,
      );
      return stat
        ? { icon: stat.icon, title: stat.label }
        : { icon: "⚽", title: "Acción del partido" };
    }
  }
}

export default function LiveMatchTimeline({
  events,
  playerNames,
  teamNames,
  historicalStats = [],
}: Props) {
  const latestFirst = [...events].sort(
    (a, b) =>
      b.minute - a.minute ||
      Date.parse(b.created_at) - Date.parse(a.created_at) ||
      b.id.localeCompare(a.id),
  );

  return (
    <section aria-labelledby="fantasy-live-timeline-title">
      <div className="mb-2 flex items-end justify-between gap-2 px-1">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#0f3d2e]">
            Cronología en directo
          </p>
          <h2 id="fantasy-live-timeline-title" className="mt-1 text-base font-black text-zinc-950">
            Eventos del partido
          </h2>
        </div>
        <span className="shrink-0 rounded-full bg-white px-3 py-1 text-[10px] font-black text-zinc-600 ring-1 ring-black/5">
          {events.length + historicalStats.reduce((sum, item) => sum + item.count, 0)} acciones
        </span>
      </div>

      {latestFirst.length === 0 && historicalStats.length === 0 ? (
        <div className="rounded-[1.25rem] bg-white px-4 py-5 text-xs leading-5 text-zinc-500 shadow-sm ring-1 ring-black/5">
          Todavía no hay eventos. Los goles, tarjetas, sustituciones y las estadísticas
          que registre Directiva aparecerán aquí.
        </div>
      ) : (
        <div className="space-y-2">
        {latestFirst.length > 0 && <ol className="overflow-hidden rounded-[1.25rem] bg-white shadow-sm ring-1 ring-black/5">
          {latestFirst.map((event) => {
            const info = eventLabel(event);
            const player = event.player_id
              ? playerNames[event.player_id] ?? "Jugador"
              : null;
            const secondary = event.secondary_player_id
              ? playerNames[event.secondary_player_id] ?? "Jugador"
              : null;
            const team = event.scoring_team_id
              ? teamNames[event.scoring_team_id] ?? "Equipo"
              : null;

            return (
              <li
                key={event.id}
                className="flex gap-3 border-b border-zinc-100 px-3 py-3 last:border-b-0"
              >
                <span className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-[#e8f2ed] text-xs font-black tabular-nums text-[#0f3d2e]">
                  {event.minute}&apos;
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 text-xs font-black text-zinc-950">
                    <span aria-hidden="true">{info.icon}</span>
                    <span>{info.title}</span>
                  </p>
                  {event.event_type === "substitution" ? (
                    <div className="mt-1 space-y-0.5 text-[11px] leading-4">
                      <p className="text-red-700">
                        Sale: <strong>{player ?? "Jugador"}</strong>
                      </p>
                      {secondary && (
                        <p className="text-[#0f3d2e]">
                          Entra: <strong>{secondary}</strong>
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                      {player ?? (event.event_type === "goal"
                        ? "Goleador no registrado"
                        : "Jugador no registrado")}
                      {event.event_type === "goal" && team && (
                        <span> · Gol para {team}</span>
                      )}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>}
        {historicalStats.length > 0 && (
          <div className="rounded-[1.25rem] bg-white px-3 py-3 text-xs shadow-sm ring-1 ring-black/5">
            <p className="mb-2 font-black text-zinc-700">Estadísticas anteriores · minuto no registrado</p>
            <ul className="space-y-2">
              {historicalStats.map((item) => {
                const stat = FANTASY_EXTRA_STATS.find((entry) => entry.field === item.field);
                if (!stat) return null;
                return (
                  <li key={`${item.playerId}-${item.field}`} className="flex items-center justify-between gap-2">
                    <span className="min-w-0 text-zinc-700">{stat.icon} {stat.label} · {playerNames[item.playerId] ?? "Jugador"}</span>
                    <span className="shrink-0 font-black tabular-nums text-[#0f3d2e]">×{item.count}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
        </div>
      )}
    </section>
  );
}
