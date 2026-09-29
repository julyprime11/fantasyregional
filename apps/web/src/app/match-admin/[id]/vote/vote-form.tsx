"use client";

import { useActionState, useState } from "react";
import type { VoteState } from "@/app/matches/[id]/vote/actions";

export type MobileVotingPlayer = {
  id: string;
  name: string;
  shirtNumber: number | null;
  position: string;
  team: string;
};

type Props = {
  action: (
    state: VoteState,
    form: FormData,
  ) => Promise<VoteState>;
  players: MobileVotingPlayer[];
};

export function MobileVoteForm({
  action,
  players,
}: Props) {
  const [state, formAction, pending] = useActionState(
    action,
    {
      status: "idle",
      message: "",
    },
  );

  const [scores, setScores] = useState<
    Record<string, number | null>
  >(() => {
    const initial: Record<string, number | null> = {};

    for (const player of players) {
      const saved =
        state.values?.[`score:${player.id}`];

      initial[player.id] = saved
        ? Number(saved)
        : null;
    }

    return initial;
  });

  function setScore(
    playerId: string,
    score: number,
  ) {
    setScores((current) => ({
      ...current,
      [playerId]: score,
    }));
  }

  function clearScore(playerId: string) {
    setScores((current) => ({
      ...current,
      [playerId]: null,
    }));
  }

  const selectedCount = Object.values(
    scores,
  ).filter((score) => score !== null).length;

  return (
    <form
      action={formAction}
      className="mt-6 space-y-5"
    >
      <section className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <h2 className="font-bold text-zinc-950">
          Identidad del votante
        </h2>

        <p className="mt-1 text-sm text-zinc-500">
          Temporal durante el desarrollo. Más
          adelante se sustituirá por el usuario
          identificado.
        </p>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-700">
            UUID del votante
          </span>

          <input
            name="voter_id"
            required
            maxLength={36}
            defaultValue={
              state.values?.voter_id ?? ""
            }
            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
            className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm outline-none focus:border-zinc-950"
          />
        </label>

        <label className="mt-4 block">
          <span className="text-sm font-medium text-zinc-700">
            Rol
          </span>

          <input
            name="voter_role"
            required
            maxLength={500}
            defaultValue={
              state.values?.voter_role ?? ""
            }
            placeholder="Jugador, entrenador, directiva..."
            className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
          />
        </label>
      </section>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">
            Jugadores
          </h2>

          <p className="text-sm text-zinc-500">
            Toca una nota del 1 al 10.
          </p>
        </div>

        <span className="rounded-full bg-zinc-200 px-3 py-1 text-sm font-semibold text-zinc-700">
          {selectedCount}/{players.length}
        </span>
      </div>

      {players.map((player) => {
        const selected =
          scores[player.id];

        return (
          <article
            key={player.id}
            className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
          >
            <div className="flex items-start gap-3">
              {player.shirtNumber !== null && (
                <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-zinc-950 px-2 font-bold text-white">
                  {player.shirtNumber}
                </span>
              )}

              <div>
                <h3 className="text-lg font-bold text-zinc-950">
                  {player.name}
                </h3>

                <p className="text-sm text-zinc-500">
                  {player.position} ·{" "}
                  {player.team}
                </p>
              </div>
            </div>

            <input
              type="hidden"
              name={`score:${player.id}`}
              value={selected ?? ""}
            />

            <div className="mt-5 grid grid-cols-5 gap-2">
              {Array.from(
                { length: 10 },
                (_, index) => index + 1,
              ).map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() =>
                    setScore(
                      player.id,
                      score,
                    )
                  }
                  className={`aspect-square rounded-xl text-lg font-bold active:scale-95 ${
                    selected === score
                      ? "bg-zinc-950 text-white ring-2 ring-zinc-950"
                      : "border border-zinc-300 bg-white text-zinc-800"
                  }`}
                >
                  {score}
                </button>
              ))}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                {selected === null
                  ? "Sin puntuar"
                  : `Nota seleccionada: ${selected}`}
              </p>

              {selected !== null && (
                <button
                  type="button"
                  onClick={() =>
                    clearScore(player.id)
                  }
                  className="text-sm font-medium text-zinc-600 underline"
                >
                  Quitar
                </button>
              )}
            </div>
          </article>
        );
      })}

      {state.message && (
        <p
          role={
            state.status === "error"
              ? "alert"
              : "status"
          }
          className={`rounded-xl p-4 text-sm font-medium ${
            state.status === "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {state.message}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 border-t border-zinc-200 bg-zinc-50/95 p-4 backdrop-blur">
        <button
          type="submit"
          disabled={
            pending ||
            selectedCount === 0
          }
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-lg font-bold text-white disabled:opacity-40"
        >
          {pending
            ? "Enviando votos..."
            : `Enviar ${selectedCount} ${
                selectedCount === 1
                  ? "voto"
                  : "votos"
              }`}
        </button>
      </div>
    </form>
  );
}