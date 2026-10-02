"use client";

import {
  useActionState,
} from "react";

import {
  syncFfcvAction,
  type FfcvSyncActionState,
} from "./actions";

const initialState: FfcvSyncActionState = {
  status:
    "idle",

  message:
    "",
};

export function FfcvSyncForm() {
  const [
    state,
    action,
    pending,
  ] =
    useActionState(
      syncFfcvAction,
      initialState,
    );

  return (
    <form
      action={
        action
      }
      className="space-y-4"
    >
      <button
        type="submit"
        disabled={
          pending
        }
        className="min-h-12 w-full rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending
          ? "Sincronizando con FFCV..."
          : "Sincronizar plantilla FFCV"}
      </button>

      {state.message && (
        <div
          className={`rounded-[1rem] p-3 ${
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

      {state.summary && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            <Summary
              label="FFCV"
              value={
                state.summary
                  .total
              }
            />

            <Summary
              label="Vinculados"
              value={
                state.summary
                  .matched
              }
            />

            <Summary
              label="Actualizados"
              value={
                state.summary
                  .updated
              }
            />
          </div>

          {state.summary
            .unmatched
            .length >
            0 && (
            <section className="rounded-[1rem] bg-amber-50 p-3">
              <p className="text-xs font-black text-amber-900">
                Sin coincidencia
              </p>

              <div className="mt-2 space-y-1">
                {state.summary.unmatched.map(
                  (
                    player,
                  ) => (
                    <p
                      key={
                        player
                      }
                      className="text-[10px] text-amber-700"
                    >
                      {player}
                    </p>
                  ),
                )}
              </div>
            </section>
          )}

          {state.summary
            .errors
            .length >
            0 && (
            <section className="rounded-[1rem] bg-red-50 p-3">
              <p className="text-xs font-black text-red-700">
                Errores
              </p>

              <div className="mt-2 space-y-1">
                {state.summary.errors.map(
                  (
                    error,
                  ) => (
                    <p
                      key={
                        error
                      }
                      className="text-[10px] text-red-600"
                    >
                      {error}
                    </p>
                  ),
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </form>
  );
}

function Summary({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1rem] bg-white p-3 text-center shadow-sm ring-1 ring-black/5">
      <p className="text-xl font-black text-zinc-950">
        {value}
      </p>

      <p className="mt-0.5 text-[7px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}