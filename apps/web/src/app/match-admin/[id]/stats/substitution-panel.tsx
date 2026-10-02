"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  performMatchSubstitutionAction,
} from "./actions";

type Candidate = {
  entryId: string;
  name: string;
  shirtNumber:
    | number
    | null;
  position: string;
};

type Props = {
  matchId: string;

  playerOut: {
    entryId: string;
    name: string;
    shirtNumber:
      | number
      | null;
    position: string;
  };

  candidates: Candidate[];

  onSuccess: () => void;
  onClose: () => void;
};

export default function SubstitutionPanel({
  matchId,
  playerOut,
  candidates,
  onSuccess,
  onClose,
}: Props) {
  const [
    selectedEntryId,
    setSelectedEntryId,
  ] =
    useState<
      string | null
    >(null);

  const [
    pending,
    startTransition,
  ] =
    useTransition();

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  function confirmSubstitution() {
    if (
      !selectedEntryId
    ) {
      setErrorMessage(
        "Selecciona el jugador que entra.",
      );

      return;
    }

    const playerIn =
      candidates.find(
        (player) =>
          player.entryId ===
          selectedEntryId,
      );

    if (!playerIn) {
      return;
    }

    const confirmed =
      window.confirm(
        `¿Confirmas el cambio?\n\nSale: ${playerOut.name}\nEntra: ${playerIn.name}`,
      );

    if (!confirmed) {
      return;
    }

    setErrorMessage("");

    startTransition(
      async () => {
        const result =
          await performMatchSubstitutionAction(
            matchId,
            playerOut.entryId,
            selectedEntryId,
          );

        if (
          result.status ===
          "error"
        ) {
          setErrorMessage(
            result.message,
          );

          return;
        }

        onSuccess();
        onClose();
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center bg-black/55 sm:items-center sm:p-4"
      onClick={
        onClose
      }
    >
      <div
        className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-[#f5f6f4] p-5 shadow-2xl sm:rounded-[2rem]"
        onClick={(
          event,
        ) =>
          event.stopPropagation()
        }
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Partido en directo
            </p>

            <h2 className="mt-1 text-2xl font-black text-zinc-950">
              Sustitución
            </h2>

            <p className="mt-1 text-sm text-zinc-500">
              Selecciona el jugador que entra al campo.
            </p>
          </div>

          <button
            type="button"
            onClick={
              onClose
            }
            disabled={
              pending
            }
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-xl font-black text-zinc-700 shadow-sm ring-1 ring-black/5"
          >
            ×
          </button>
        </div>

        {/* SALE */}
        <section className="mt-6 rounded-[1.3rem] bg-red-50 p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-red-500">
            Sale
          </p>

          <div className="mt-3 flex items-center gap-3">
            <PlayerCircle
              shirtNumber={
                playerOut.shirtNumber
              }
            />

            <div>
              <p className="font-black text-zinc-950">
                {playerOut.name}
              </p>

              <p className="mt-1 text-xs font-semibold text-zinc-500">
                {playerOut.position}
              </p>
            </div>
          </div>
        </section>

        {/* ENTRA */}
        <section className="mt-5">
          <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#0f3d2e]">
            Entra
          </p>

          {candidates.length ===
          0 ? (
            <div className="mt-3 rounded-[1.3rem] bg-white p-4 text-sm text-zinc-500 ring-1 ring-black/5">
              No hay jugadores disponibles para entrar.
            </div>
          ) : (
            <div className="mt-3 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-black/5">
              {candidates.map(
                (
                  player,
                ) => {
                  const selected =
                    player.entryId ===
                    selectedEntryId;

                  return (
                    <button
                      key={
                        player.entryId
                      }
                      type="button"
                      disabled={
                        pending
                      }
                      onClick={() =>
                        setSelectedEntryId(
                          player.entryId,
                        )
                      }
                      className={`flex min-h-16 w-full items-center justify-between gap-3 border-b border-zinc-100 px-4 text-left last:border-b-0 ${
                        selected
                          ? "bg-[#e8f2ed]"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <PlayerCircle
                          shirtNumber={
                            player.shirtNumber
                          }
                        />

                        <div className="min-w-0">
                          <p className="truncate font-black text-zinc-950">
                            {player.name}
                          </p>

                          <p className="mt-1 text-xs font-semibold text-zinc-400">
                            {player.position}
                          </p>
                        </div>
                      </div>

                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black ${
                          selected
                            ? "bg-[#0f3d2e] text-white"
                            : "bg-zinc-100 text-zinc-400"
                        }`}
                      >
                        {selected
                          ? "✓"
                          : "+"}
                      </div>
                    </button>
                  );
                },
              )}
            </div>
          )}
        </section>

        {errorMessage && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
          >
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          disabled={
            pending ||
            !selectedEntryId
          }
          onClick={
            confirmSubstitution
          }
          className="mt-5 flex min-h-14 w-full items-center justify-center rounded-[1.1rem] bg-[#0f3d2e] px-4 text-base font-black text-white disabled:opacity-40"
        >
          {pending
            ? "Registrando cambio..."
            : "🔄 Confirmar sustitución"}
        </button>
      </div>
    </div>
  );
}

function PlayerCircle({
  shirtNumber,
}: {
  shirtNumber:
    | number
    | null;
}) {
  return (
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white font-black text-[#0f3d2e] shadow-sm ring-1 ring-black/5">
      {shirtNumber ??
        "—"}
    </div>
  );
}