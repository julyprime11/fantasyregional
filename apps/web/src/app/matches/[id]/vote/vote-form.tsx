"use client";

import {
  useActionState,
  useMemo,
  useState,
} from "react";

import type {
  VoteState,
} from "@/app/matches/[id]/vote/actions";

export type MobileVotingPlayer = {
  id: string;

  name: string;

  shirtNumber:
    number | null;

  position: string;

  team: string;

  existingScore:
    number | null;
};

type Props = {
  action: (
    state: VoteState,
    form: FormData,
  ) => Promise<VoteState>;

  players:
    MobileVotingPlayer[];

  disabled?: boolean;
};

export function MobileVoteForm({
  action,
  players,
  disabled = false,
}: Props) {
  const [
    state,
    formAction,
    pending,
  ] =
    useActionState(
      action,
      {
        status:
          "idle",

        message:
          "",
      },
    );

  /*
   * Las notas existentes se cargan
   * directamente en el estado.
   *
   * De esta manera el usuario ve
   * exactamente lo que votó anteriormente.
   */
  const initialScores =
    useMemo(() => {
      const initial: Record<
        string,
        number | null
      > = {};

      for (
        const player of
        players
      ) {
        initial[
          player.id
        ] =
          player.existingScore;
      }

      return initial;
    }, [
      players,
    ]);

  const [
    scores,
    setScores,
  ] =
    useState<
      Record<
        string,
        number | null
      >
    >(
      initialScores,
    );

  function setScore(
    playerId: string,
    score: number,
  ) {
    setScores(
      (
        current,
      ) => ({
        ...current,

        [playerId]:
          score,
      }),
    );
  }

  function clearNewScore(
    playerId: string,
  ) {
    /*
     * Los votos ya guardados no se
     * eliminan desde esta pantalla.
     *
     * Solo permitimos cancelar una
     * selección todavía no guardada.
     */
    if (
      initialScores[
        playerId
      ] !== null
    ) {
      setScores(
        (
          current,
        ) => ({
          ...current,

          [playerId]:
            initialScores[
              playerId
            ],
        }),
      );

      return;
    }

    setScores(
      (
        current,
      ) => ({
        ...current,

        [playerId]:
          null,
      }),
    );
  }

  /*
   * Número de jugadores que actualmente
   * tienen una nota.
   */
  const votedCount =
    players.filter(
      (
        player,
      ) =>
        scores[
          player.id
        ] !== null,
    ).length;

  /*
   * Solo enviamos votos nuevos o
   * modificaciones.
   */
  const changedPlayers =
    players.filter(
      (
        player,
      ) =>
        scores[
          player.id
        ] !==
        initialScores[
          player.id
        ],
    );

  const changedCount =
    changedPlayers.length;

  const completed =
    players.length >
      0 &&
    votedCount ===
      players.length;

  const progress =
    players.length >
    0
      ? Math.round(
          (
            votedCount /
            players.length
          ) *
            100,
        )
      : 0;

  return (
    <form
      action={
        formAction
      }
      className="mt-4"
    >
      {/* CABECERA */}
      <div className="flex items-end justify-between gap-3 px-0.5">
        <div>
          <p className="text-[8px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Valoraciones
          </p>

          <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
            Puntúa a los jugadores
          </h2>

          <p className="mt-1 text-[11px] text-zinc-500">
            Nota del 0 al 10. Puedes modificarla mientras la votación esté abierta.
          </p>
        </div>

        <div className="shrink-0 text-right">
          <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
            {votedCount}/{players.length}
          </span>
        </div>
      </div>

      {/* PROGRESO */}
      <div className="mt-3 rounded-[1rem] bg-[#e8f2ed] p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black text-[#0b2f23]">
            Tu votación
          </p>

          <p className="text-[10px] font-black text-[#0f3d2e]">
            {progress}%
          </p>
        </div>

        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/80">
          <div
            className="h-full rounded-full bg-[#0f3d2e] transition-all"
            style={{
              width:
                `${progress}%`,
            }}
          />
        </div>
      </div>

      {completed && (
        <div className="mt-3 flex items-center gap-3 rounded-[1rem] bg-[#e8f2ed] px-3 py-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-xs font-black text-white">
            ✓
          </div>

          <div>
            <p className="text-xs font-black text-[#0b2f23]">
              Todos los jugadores tienen valoración
            </p>

            <p className="mt-0.5 text-[10px] text-[#557368]">
              Puedes seguir modificando tus notas hasta que se cierre la votación.
            </p>
          </div>
        </div>
      )}

      {/* JUGADORES */}
      <div className="mt-3 space-y-2.5">
        {players.map(
          (
            player,
          ) => {
            const selected =
              scores[
                player.id
              ];

            const initial =
              initialScores[
                player.id
              ];

            const wasSaved =
              initial !==
              null;

            const modified =
              selected !==
              initial;

            return (
              <article
                key={
                  player.id
                }
                className={`overflow-hidden rounded-[1.2rem] shadow-sm ring-1 ${
                  wasSaved
                    ? "bg-[#f0f6f3] ring-[#d7e8df]"
                    : "bg-white ring-black/5"
                }`}
              >
                <div className="p-3">
                  {/* DATOS */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                        wasSaved
                          ? "bg-[#0f3d2e] text-white"
                          : "bg-zinc-950 text-white"
                      }`}
                    >
                      {player.shirtNumber ??
                        "—"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-950">
                            {
                              player.name
                            }
                          </p>

                          <p className="mt-0.5 truncate text-[9px] font-semibold text-zinc-400">
                            {
                              player.position
                            }
                            {" · "}
                            {
                              player.team
                            }
                          </p>
                        </div>

                        {selected !==
                          null && (
                          <div className="flex items-center gap-1.5">
                            {wasSaved && (
                              <span className="hidden text-[8px] font-black uppercase tracking-wide text-[#557368] min-[380px]:inline">
                                {modified
                                  ? "Modificado"
                                  : "Guardado"}
                              </span>
                            )}

                            <span
                              className={`flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-base font-black ${
                                modified
                                  ? "bg-amber-500 text-white"
                                  : "bg-[#0f3d2e] text-white"
                              }`}
                            >
                              {
                                selected
                              }
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {modified &&
                    selected !==
                      null && (
                      <input
                        type="hidden"
                        name={`score:${player.id}`}
                        value={
                          selected
                        }
                      />
                    )}

                  {/* NOTAS 0-10 */}
                  <div className="mt-3 grid grid-cols-6 gap-1.5">
                    {Array.from(
                      {
                        length:
                          11,
                      },
                      (
                        _,
                        index,
                      ) =>
                        index,
                    ).map(
                      (
                        score,
                      ) => (
                        <button
                          key={
                            score
                          }
                          type="button"
                          disabled={
                            disabled ||
                            pending
                          }
                          onClick={() =>
                            setScore(
                              player.id,
                              score,
                            )
                          }
                          className={`h-10 rounded-[0.7rem] text-xs font-black transition active:scale-95 ${
                            selected ===
                            score
                              ? "bg-[#0f3d2e] text-white shadow-md"
                              : score >=
                                  8
                                ? "bg-[#e8f2ed] text-[#0f3d2e]"
                                : score <=
                                    4
                                  ? "bg-red-50 text-red-600"
                                  : "bg-zinc-100 text-zinc-700"
                          } disabled:opacity-40`}
                        >
                          {
                            score
                          }
                        </button>
                      ),
                    )}
                  </div>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex gap-3 text-[7px] font-black uppercase tracking-wide">
                      <span className="text-red-400">
                        0 · Muy bajo
                      </span>

                      <span className="text-zinc-400">
                        5 · Bien
                      </span>

                      <span className="text-[#0f3d2e]">
                        10 · Excelente
                      </span>
                    </div>

                    {modified && (
                      <button
                        type="button"
                        onClick={() =>
                          clearNewScore(
                            player.id,
                          )
                        }
                        className="shrink-0 text-[9px] font-bold text-zinc-400 underline"
                      >
                        Deshacer
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          },
        )}
      </div>

      {/* RESPUESTA */}
      {state.message && (
        <div
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`mt-3 rounded-[1rem] p-3 ${
            state.status ===
            "error"
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <p
            className={`text-xs font-bold ${
              state.status ===
              "error"
                ? "text-red-700"
                : "text-[#0f3d2e]"
            }`}
          >
            {
              state.message
            }
          </p>
        </div>
      )}

      {/* GUARDAR */}
      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 -mx-4 mt-4 border-t border-zinc-200 bg-[#f2f4f2]/95 px-4 py-2.5 backdrop-blur">
        <button
          type="submit"
          disabled={
            disabled ||
            pending ||
            changedCount ===
              0
          }
          className="flex min-h-12 w-full items-center justify-between rounded-[1rem] bg-[#0f3d2e] px-4 text-white shadow-lg transition active:scale-[0.99] disabled:opacity-40"
        >
          <div className="text-left">
            <p className="text-xs font-black">
              {pending
                ? "Guardando..."
                : changedCount ===
                    0
                  ? "Votación guardada"
                  : wasPlural(
                        changedCount,
                      )
                    ? "Guardar cambios"
                    : "Guardar valoración"}
            </p>

            {!pending &&
              changedCount >
                0 && (
                <p className="mt-0.5 text-[9px] text-white/60">
                  {
                    changedCount
                  }{" "}
                  {changedCount ===
                  1
                    ? "jugador modificado"
                    : "jugadores modificados"}
                </p>
              )}
          </div>

          {!pending &&
            changedCount >
              0 && (
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-black text-[#0f3d2e]">
                →
              </span>
            )}
        </button>
      </div>
    </form>
  );
}

function wasPlural(
  count: number,
): boolean {
  return count >
    1;
}