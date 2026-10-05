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
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white shadow-lg transition active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={
            pending
              ? "animate-spin"
              : ""
          }
        >
          ↻
        </span>

        <span>
          {pending
            ? "Sincronizando con FFCV..."
            : "Sincronizar plantilla FFCV"}
        </span>
      </button>

      {state.message && (
        <div
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`rounded-[1rem] p-3 ${
            state.status ===
            "error"
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                state.status ===
                "error"
                  ? "bg-red-600 text-white"
                  : "bg-[#0f3d2e] text-white"
              }`}
            >
              {state.status ===
              "error"
                ? "!"
                : "✓"}
            </div>

            <p
              className={`pt-0.5 text-xs font-bold leading-5 ${
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
              highlight
            />
          </div>

          {state.summary
            .unmatched
            .length >
            0 && (
            <section className="rounded-[1rem] bg-amber-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-amber-900">
                    Sin coincidencia
                  </p>

                  <p className="mt-0.5 text-[9px] leading-4 text-amber-700">
                    Estos jugadores de FFCV no se pudieron vincular automáticamente.
                  </p>
                </div>

                <span className="rounded-full bg-amber-100 px-2 py-1 text-[9px] font-black text-amber-800">
                  {
                    state.summary
                      .unmatched
                      .length
                  }
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {state.summary.unmatched.map(
                  (
                    player,
                  ) => (
                    <div
                      key={
                        player
                      }
                      className="rounded-xl bg-white/60 px-2.5 py-2"
                    >
                      <p className="text-[10px] font-semibold text-amber-800">
                        {player}
                      </p>
                    </div>
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
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-black text-red-700">
                    Errores
                  </p>

                  <p className="mt-0.5 text-[9px] leading-4 text-red-600">
                    Algunas operaciones no pudieron completarse.
                  </p>
                </div>

                <span className="rounded-full bg-red-100 px-2 py-1 text-[9px] font-black text-red-700">
                  {
                    state.summary
                      .errors
                      .length
                  }
                </span>
              </div>

              <div className="mt-3 space-y-1.5">
                {state.summary.errors.map(
                  (
                    error,
                  ) => (
                    <div
                      key={
                        error
                      }
                      className="rounded-xl bg-white/70 px-2.5 py-2"
                    >
                      <p className="text-[10px] leading-4 text-red-700">
                        {error}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </section>
          )}

          {state.summary
            .unmatched
            .length ===
            0 &&
            state.summary
              .errors
              .length ===
              0 && (
            <section className="rounded-[1rem] bg-[#e8f2ed] p-3">
              <p className="text-xs font-black text-[#0f3d2e]">
                Sincronización completada
              </p>

              <p className="mt-1 text-[10px] leading-4 text-[#557368]">
                Todos los jugadores encontrados se procesaron sin incidencias.
              </p>
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
  highlight = false,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1rem] p-3 text-center shadow-sm ring-1 ${
        highlight
          ? "bg-[#e8f2ed] ring-[#d7e8df]"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-xl font-black ${
          highlight
            ? "text-[#0f3d2e]"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p
        className={`mt-0.5 text-[7px] font-black uppercase tracking-wide ${
          highlight
            ? "text-[#557368]"
            : "text-zinc-400"
        }`}
      >
        {label}
      </p>
    </div>
  );
}