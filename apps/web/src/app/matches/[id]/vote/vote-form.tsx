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
  ] = useActionState(
    action,
    {
      status: "idle",
      message: "",
    },
  );

  const [
    scores,
    setScores,
  ] = useState<
    Record<
      string,
      number | null
    >
  >(() => {
    const initial: Record<
      string,
      number | null
    > = {};

    for (const player of players) {
      initial[player.id] = null;
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
        [playerId]: score,
      }),
    );
  }

  function clearScore(
    playerId: string,
  ) {
    setScores(
      (current) => ({
        ...current,
        [playerId]: null,
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
      action={formAction}
      className="mt-5"
    >
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">
            Jugadores
          </h2>

          <p className="text-xs text-zinc-500">
            Pulsa una nota del 1 al 10.
          </p>
        </div>

        <div className="text-right">
          <span className="inline-flex rounded-full bg-zinc-200 px-3 py-1 text-xs font-bold text-zinc-700">
            {selectedCount} nuevos
          </span>

          {alreadyVotedCount >
            0 && (
            <p className="mt-1 text-[11px] font-medium text-green-700">
              {alreadyVotedCount} ya votados
            </p>
          )}
        </div>
      </div>

      {pendingPlayersCount ===
        0 && (
        <div className="mt-4 rounded-2xl bg-green-50 p-4 ring-1 ring-green-100">
          <p className="font-bold text-green-800">
            Votación completada
          </p>

          <p className="mt-1 text-sm text-green-700">
            Ya has puntuado a todos los jugadores disponibles.
          </p>
        </div>
      )}

      <div className="mt-4 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200">
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
              <div
                key={
                  player.id
                }
                className={`border-b border-zinc-100 p-3 last:border-b-0 ${
                  alreadyVoted
                    ? "bg-green-50/50"
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg px-1 text-xs font-black ${
                      alreadyVoted
                        ? "bg-green-600 text-white"
                        : "bg-zinc-950 text-white"
                    }`}
                  >
                    {player.shirtNumber ??
                      "—"}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-bold text-zinc-950">
                        {
                          player.name
                        }
                      </p>

                      {alreadyVoted ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-bold text-green-700">
                            ✓ Votado
                          </span>

                          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-green-600 px-2 text-sm font-black text-white">
                            {
                              player.existingScore
                            }
                          </span>
                        </div>
                      ) : selected !==
                        null ? (
                        <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-zinc-950 px-2 text-sm font-black text-white">
                          {
                            selected
                          }
                        </span>
                      ) : null}
                    </div>

                    <p className="truncate text-[11px] text-zinc-400">
                      {
                        player.position
                      }
                      {" · "}
                      {
                        player.team
                      }
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

                    <div className="mt-2 grid grid-cols-10 gap-1">
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
                            className={`h-9 min-w-0 rounded-lg text-xs font-black active:scale-95 ${
                              selected ===
                              score
                                ? "bg-zinc-950 text-white"
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

                    {selected !==
                      null && (
                      <div className="mt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            clearScore(
                              player.id,
                            )
                          }
                          className="text-[11px] font-medium text-zinc-400 underline"
                        >
                          Quitar nota
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          },
        )}
      </div>

      {state.message && (
        <p
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`mt-4 rounded-xl p-4 text-sm font-medium ${
            state.status ===
            "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {
            state.message
          }
        </p>
      )}

      {pendingPlayersCount >
        0 && (
        <div className="sticky bottom-0 z-20 -mx-4 mt-5 border-t border-zinc-200 bg-zinc-50/95 p-4 backdrop-blur">
          <button
            type="submit"
            disabled={
              disabled ||
              pending ||
              selectedCount ===
                0
            }
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-base font-bold text-white disabled:opacity-40"
          >
            {pending
              ? "Enviando..."
              : `Enviar ${selectedCount} ${
                  selectedCount ===
                  1
                    ? "voto"
                    : "votos"
                }`}
          </button>
        </div>
      )}
    </form>
  );
}