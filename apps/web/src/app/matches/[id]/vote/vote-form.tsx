"use client";

import {
  useActionState,
  useState,
} from "react";

import type {
  VoteState,
} from "@/app/matches/[id]/vote/actions";

export type MobileVotingPlayer = {
  id: string;
  name: string;
  shirtNumber: number | null;
  position: string;
  team: string;
  existingScore: number | null;
};

type Props = {
  action: (
    state: VoteState,
    form: FormData,
  ) => Promise<VoteState>;

  players: MobileVotingPlayer[];

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
        status: "idle",
        message: "",
      },
    );

  const [
    scores,
    setScores,
  ] =
    useState<
      Record<
        string,
        number | null
      >
    >(() => {
      const initial: Record<
        string,
        number | null
      > = {};

      for (
        const player of
        players
      ) {
        initial[player.id] =
          null;
      }

      return initial;
    });

  function setScore(
    playerId: string,
    score: number,
  ) {
    setScores(
      (current) => ({
        ...current,
        [playerId]:
          score,
      }),
    );
  }

  function clearScore(
    playerId: string,
  ) {
    setScores(
      (current) => ({
        ...current,
        [playerId]:
          null,
      }),
    );
  }

  const selectedCount =
    players.filter(
      (player) =>
        player.existingScore ===
          null &&
        scores[player.id] !==
          null,
    ).length;

  const alreadyVotedCount =
    players.filter(
      (player) =>
        player.existingScore !==
        null,
    ).length;

  const pendingPlayersCount =
    players.length -
    alreadyVotedCount;

  return (
    <form
      action={
        formAction
      }
      className="mt-7"
    >
      <div className="flex items-end justify-between px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            Valoraciones
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
            Jugadores
          </h2>

          <p className="mt-1 text-xs text-zinc-500">
            Selecciona una nota del 1 al 10.
          </p>
        </div>

        <div className="text-right">
          <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
            {selectedCount} nuevos
          </span>

          {alreadyVotedCount >
            0 && (
            <p className="mt-1 text-[10px] font-black text-[#0f3d2e]">
              {alreadyVotedCount} ya votados
            </p>
          )}
        </div>
      </div>

      {pendingPlayersCount ===
        0 && (
        <div className="mt-4 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f3d2e] font-black text-white">
              ✓
            </div>

            <div>
              <p className="font-black text-[#0b2f23]">
                Votación completada
              </p>

              <p className="mt-1 text-xs leading-5 text-[#557368]">
                Ya has puntuado a todos los jugadores disponibles.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 space-y-3">
        {players.map(
          (player) => {
            const selected =
              scores[
                player.id
              ];

            const alreadyVoted =
              player.existingScore !==
              null;

            return (
              <article
                key={
                  player.id
                }
                className={`overflow-hidden rounded-[1.4rem] shadow-sm ring-1 ${
                  alreadyVoted
                    ? "bg-[#f0f6f3] ring-[#d7e8df]"
                    : "bg-white ring-black/5"
                }`}
              >
                <div className="p-4">
                  <div className="flex items-center gap-3">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-black ${
                        alreadyVoted
                          ? "bg-[#0f3d2e] text-white"
                          : "bg-zinc-950 text-white"
                      }`}
                    >
                      {player.shirtNumber ??
                        "—"}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate font-black text-zinc-950">
                          {player.name}
                        </p>

                        {alreadyVoted ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wide text-[#557368]">
                              Votado
                            </span>

                            <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-[#0f3d2e] px-2 text-base font-black text-white">
                              {player.existingScore}
                            </span>
                          </div>
                        ) : selected !==
                          null ? (
                          <span className="flex h-9 min-w-9 items-center justify-center rounded-full bg-zinc-950 px-2 text-base font-black text-white">
                            {selected}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-1 truncate text-[11px] font-semibold text-zinc-400">
                        {player.position}
                        {" · "}
                        {player.team}
                      </p>
                    </div>
                  </div>

                  {!alreadyVoted && (
                    <>
                      <input
                        type="hidden"
                        name={`score:${player.id}`}
                        value={
                          selected ??
                          ""
                        }
                      />

                      <div className="mt-4 grid grid-cols-5 gap-2">
                        {Array.from(
                          {
                            length: 10,
                          },
                          (
                            _,
                            index,
                          ) =>
                            index +
                            1,
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
                              className={`h-12 rounded-xl text-sm font-black transition active:scale-95 ${
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

                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex gap-4 text-[9px] font-black uppercase tracking-wide">
                          <span className="text-red-400">
                            1 · Bajo
                          </span>

                          <span className="text-zinc-400">
                            5 · Bien
                          </span>

                          <span className="text-[#0f3d2e]">
                            10 · Excelente
                          </span>
                        </div>
                      </div>

                      {selected !==
                        null && (
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              clearScore(
                                player.id,
                              )
                            }
                            className="text-[11px] font-bold text-zinc-400 underline"
                          >
                            Quitar nota
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </article>
            );
          },
        )}
      </div>

      {state.message && (
        <div
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`mt-4 rounded-[1.2rem] p-4 ${
            state.status ===
            "error"
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <p
            className={`text-sm font-bold ${
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

      {pendingPlayersCount >
        0 && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-5 border-t border-zinc-200 bg-[#f2f4f2]/95 p-4 backdrop-blur">
          <button
            type="submit"
            disabled={
              disabled ||
              pending ||
              selectedCount ===
                0
            }
            className="flex min-h-14 w-full items-center justify-between rounded-[1.2rem] bg-[#0f3d2e] px-5 text-white shadow-lg disabled:opacity-40"
          >
            <div className="text-left">
              <p className="text-sm font-black">
                {pending
                  ? "Enviando votos..."
                  : "Enviar votación"}
              </p>

              {!pending && (
                <p className="mt-0.5 text-[10px] text-white/55">
                  {selectedCount}{" "}
                  {selectedCount ===
                  1
                    ? "jugador seleccionado"
                    : "jugadores seleccionados"}
                </p>
              )}
            </div>

            {!pending && (
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-black text-[#0f3d2e]">
                →
              </span>
            )}
          </button>
        </div>
      )}
    </form>
  );
}