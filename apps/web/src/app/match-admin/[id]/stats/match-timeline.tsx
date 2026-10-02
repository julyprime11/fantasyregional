"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  createBrowserSupabaseClient,
} from "@/lib/supabase/client";

type TimelineEvent = {
  id: string;

  matchId: string;

  eventType:
    | "goal"
    | "assist"
    | "yellow_card"
    | "red_card"
    | "substitution";

  playerId:
    | string
    | null;

  secondaryPlayerId:
    | string
    | null;

  minute: number;

  createdAt: string;
};

type Props = {
  matchId: string;

  initialEvents:
    TimelineEvent[];

  playerNames:
    Record<
      string,
      string
    >;
};

export default function MatchTimeline({
  matchId,
  initialEvents,
  playerNames,
}: Props) {
  const [
    events,
    setEvents,
  ] =
    useState(
      initialEvents,
    );

  useEffect(() => {
    setEvents(
      initialEvents,
    );
  }, [
    initialEvents,
  ]);

  useEffect(() => {
    const supabase =
      createBrowserSupabaseClient();

    const channel =
      supabase
        .channel(
          `match-events-${matchId}`,
        )

        /*
         * NUEVOS EVENTOS
         */
        .on(
          "postgres_changes",
          {
            event:
              "INSERT",

            schema:
              "public",

            table:
              "match_events",

            filter:
              `match_id=eq.${matchId}`,
          },
          (
            payload,
          ) => {
            const row =
              payload.new as {
                id: string;

                match_id:
                  string;

                event_type:
                  TimelineEvent["eventType"];

                player_id:
                  string | null;

                secondary_player_id:
                  string | null;

                minute:
                  number;

                created_at:
                  string;
              };

            const next: TimelineEvent = {
              id:
                row.id,

              matchId:
                row.match_id,

              eventType:
                row.event_type,

              playerId:
                row.player_id,

              secondaryPlayerId:
                row.secondary_player_id,

              minute:
                row.minute,

              createdAt:
                row.created_at,
            };

            setEvents(
              (
                current,
              ) => {
                if (
                  current.some(
                    (
                      event,
                    ) =>
                      event.id ===
                      next.id,
                  )
                ) {
                  return current;
                }

                return [
                  next,
                  ...current,
                ].sort(
                  sortEvents,
                );
              },
            );
          },
        )

        /*
         * EVENTOS ELIMINADOS
         *
         * Esto ocurre por ejemplo si alguien
         * corrige un gol con el botón -.
         */
        .on(
          "postgres_changes",
          {
            event:
              "DELETE",

            schema:
              "public",

            table:
              "match_events",

            filter:
              `match_id=eq.${matchId}`,
          },
          (
            payload,
          ) => {
            const deleted =
              payload.old as {
                id?: string;
              };

            if (
              !deleted.id
            ) {
              return;
            }

            setEvents(
              (
                current,
              ) =>
                current.filter(
                  (
                    event,
                  ) =>
                    event.id !==
                    deleted.id,
                ),
            );
          },
        )
        .subscribe();

    return () => {
      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    matchId,
  ]);

  return (
    <section>
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Directo
          </p>

          <h2 className="mt-1 text-xl font-black text-zinc-950">
            Eventos del partido
          </h2>
        </div>

        <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
          {events.length}
        </span>
      </div>

      {events.length ===
      0 ? (
        <div className="mt-3 rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-black text-zinc-950">
            Todavía no hay eventos
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Goles, tarjetas y sustituciones aparecerán aquí automáticamente.
          </p>
        </div>
      ) : (
        <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">
          {events.map(
            (
              event,
            ) => (
              <TimelineRow
                key={
                  event.id
                }
                event={
                  event
                }
                playerNames={
                  playerNames
                }
              />
            ),
          )}
        </div>
      )}
    </section>
  );
}

function TimelineRow({
  event,
  playerNames,
}: {
  event:
    TimelineEvent;

  playerNames:
    Record<
      string,
      string
    >;
}) {
  const player =
    event.playerId
      ? playerNames[
          event.playerId
        ] ??
        "Jugador"
      : "Jugador";

  const secondaryPlayer =
    event.secondaryPlayerId
      ? playerNames[
          event.secondaryPlayerId
        ] ??
        "Jugador"
      : null;

  return (
    <div className="flex gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0">
      {/* MINUTO */}
      <div className="flex h-10 min-w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 px-2">
        <span className="text-xs font-black text-zinc-700">
          {event.minute}
          &apos;
        </span>
      </div>

      {/* EVENTO */}
      <div className="min-w-0 flex-1">
        {event.eventType ===
          "goal" && (
          <>
            <p className="font-black text-zinc-950">
              ⚽ Gol
            </p>

            <p className="mt-0.5 text-xs font-semibold text-zinc-500">
              {player}
            </p>
          </>
        )}

        {event.eventType ===
          "assist" && (
          <>
            <p className="font-black text-zinc-950">
              👟 Asistencia
            </p>

            <p className="mt-0.5 text-xs font-semibold text-zinc-500">
              {player}
            </p>
          </>
        )}

        {event.eventType ===
          "yellow_card" && (
          <>
            <p className="font-black text-zinc-950">
              🟨 Tarjeta amarilla
            </p>

            <p className="mt-0.5 text-xs font-semibold text-zinc-500">
              {player}
            </p>
          </>
        )}

        {event.eventType ===
          "red_card" && (
          <>
            <p className="font-black text-zinc-950">
              🟥 Tarjeta roja
            </p>

            <p className="mt-0.5 text-xs font-semibold text-zinc-500">
              {player}
            </p>
          </>
        )}

        {event.eventType ===
          "substitution" && (
          <>
            <p className="font-black text-zinc-950">
              🔄 Sustitución
            </p>

            <p className="mt-1 text-xs text-red-600">
              Sale:{" "}
              <span className="font-bold">
                {player}
              </span>
            </p>

            {secondaryPlayer && (
              <p className="mt-0.5 text-xs text-emerald-700">
                Entra:{" "}
                <span className="font-bold">
                  {
                    secondaryPlayer
                  }
                </span>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function sortEvents(
  a: TimelineEvent,
  b: TimelineEvent,
): number {
  if (
    a.minute !==
    b.minute
  ) {
    return (
      b.minute -
      a.minute
    );
  }

  return (
    new Date(
      b.createdAt,
    ).getTime() -
    new Date(
      a.createdAt,
    ).getTime()
  );
}