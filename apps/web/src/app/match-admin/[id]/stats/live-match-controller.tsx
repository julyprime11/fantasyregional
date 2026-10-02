"use client";

import {
  useEffect,
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import type {
  LiveMatchPhase,
} from "@/data/matches";

import {
  finishLiveMatchAction,
  resetLiveMatchAction,
  setLiveHalftimeAction,
  startLiveMatchAction,
  startLiveSecondHalfAction,
  updateTeamCleanSheetAction,
  type LiveMatchActionState,
} from "./actions";

type ManagedTeam = {
  id: string;
  name: string;
  cleanSheet: boolean;
};

type Props = {
  matchId: string;

  homeTeam: string;
  awayTeam: string;

  homeScore:
    | number
    | null;

  awayScore:
    | number
    | null;

  phase:
    LiveMatchPhase;

  clockSeconds: number;

  clockStartedAt:
    | string
    | null;

  managedTeams:
    ManagedTeam[];
};

export default function LiveMatchController({
  matchId,
  homeTeam,
  awayTeam,
  homeScore,
  awayScore,
  phase,
  clockSeconds,
  clockStartedAt,
  managedTeams,
}: Props) {
  const router =
    useRouter();

  const [
    pending,
    startTransition,
  ] =
    useTransition();

  const [
    message,
    setMessage,
  ] =
    useState("");

  const [
    messageType,
    setMessageType,
  ] =
    useState<
      | "success"
      | "error"
      | null
    >(null);

  const [
    displaySeconds,
    setDisplaySeconds,
  ] =
    useState(() =>
      calculateDisplaySeconds(
        phase,
        clockSeconds,
        clockStartedAt,
      ),
    );

  const [
    localManagedTeams,
    setLocalManagedTeams,
  ] =
    useState(
      managedTeams,
    );

  /*
   * MODAL RESULTADO FINAL
   */
  const [
    finalScoreOpen,
    setFinalScoreOpen,
  ] =
    useState(false);

  const [
    finalHomeScore,
    setFinalHomeScore,
  ] =
    useState(
      homeScore ??
        0,
    );

  const [
    finalAwayScore,
    setFinalAwayScore,
  ] =
    useState(
      awayScore ??
        0,
    );

  const [
    finalScoreError,
    setFinalScoreError,
  ] =
    useState("");

  useEffect(() => {
    setLocalManagedTeams(
      managedTeams,
    );
  }, [
    managedTeams,
  ]);

  useEffect(() => {
    setFinalHomeScore(
      homeScore ??
        0,
    );

    setFinalAwayScore(
      awayScore ??
        0,
    );
  }, [
    homeScore,
    awayScore,
  ]);

  /*
   * CRONÓMETRO
   */
  useEffect(() => {
    setDisplaySeconds(
      calculateDisplaySeconds(
        phase,
        clockSeconds,
        clockStartedAt,
      ),
    );

    if (
      phase !==
        "first_half" &&
      phase !==
        "second_half"
    ) {
      return;
    }

    const interval =
      window.setInterval(
        () => {
          setDisplaySeconds(
            calculateDisplaySeconds(
              phase,
              clockSeconds,
              clockStartedAt,
            ),
          );
        },
        1000,
      );

    return () => {
      window.clearInterval(
        interval,
      );
    };
  }, [
    phase,
    clockSeconds,
    clockStartedAt,
  ]);

  function execute(
    action: (
      matchId: string,
    ) => Promise<LiveMatchActionState>,
  ) {
    setMessage("");

    setMessageType(
      null,
    );

    startTransition(
      async () => {
        const result =
          await action(
            matchId,
          );

        setMessage(
          result.message,
        );

        setMessageType(
          result.status ===
          "success"
            ? "success"
            : "error",
        );

        if (
          result.status ===
          "success"
        ) {
          router.refresh();
        }
      },
    );
  }

  /*
   * ABRIR MARCADOR FINAL
   */
  function openFinalScore() {
    setMessage("");

    setMessageType(
      null,
    );

    setFinalScoreError(
      "",
    );

    setFinalHomeScore(
      homeScore ??
        0,
    );

    setFinalAwayScore(
      awayScore ??
        0,
    );

    setFinalScoreOpen(
      true,
    );
  }

  /*
   * GUARDAR MARCADOR + FINALIZAR
   */
  function confirmFinalScore() {
    if (
      !Number.isInteger(
        finalHomeScore,
      ) ||
      finalHomeScore < 0
    ) {
      setFinalScoreError(
        "Introduce un resultado válido para el equipo local.",
      );

      return;
    }

    if (
      !Number.isInteger(
        finalAwayScore,
      ) ||
      finalAwayScore < 0
    ) {
      setFinalScoreError(
        "Introduce un resultado válido para el equipo visitante.",
      );

      return;
    }

    setFinalScoreError(
      "",
    );

    setMessage("");

    setMessageType(
      null,
    );

    startTransition(
      async () => {
        const result =
          await finishLiveMatchAction(
            matchId,
            finalHomeScore,
            finalAwayScore,
          );

        if (
          result.status ===
          "error"
        ) {
          setFinalScoreError(
            result.message,
          );

          return;
        }

        setFinalScoreOpen(
          false,
        );

        setMessage(
          result.message,
        );

        setMessageType(
          "success",
        );

        router.refresh();
      },
    );
  }

  /*
   * PORTERÍA A CERO
   */
  function changeCleanSheet(
    teamId: string,
    value: boolean,
  ) {
    setMessage("");

    setMessageType(
      null,
    );

    const previousTeams =
      localManagedTeams;

    /*
     * Actualización optimista.
     */
    setLocalManagedTeams(
      (
        current,
      ) =>
        current.map(
          (
            team,
          ) =>
            team.id ===
            teamId
              ? {
                  ...team,

                  cleanSheet:
                    value,
                }
              : team,
        ),
    );

    startTransition(
      async () => {
        const result =
          await updateTeamCleanSheetAction(
            matchId,
            teamId,
            value,
          );

        if (
          result.status ===
          "error"
        ) {
          setLocalManagedTeams(
            previousTeams,
          );

          setMessage(
            result.message,
          );

          setMessageType(
            "error",
          );

          return;
        }

        setMessage(
          result.message,
        );

        setMessageType(
          "success",
        );

        router.refresh();
      },
    );
  }

  const hasResult =
    homeScore !==
      null &&
    awayScore !==
      null;

  const running =
    phase ===
      "first_half" ||
    phase ===
      "second_half";

  return (
    <>
      <section className="overflow-hidden rounded-[1.6rem] bg-zinc-950 text-white shadow-xl">
        {/* ESTADO */}
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                Match Center
              </p>

              <div className="mt-1 flex items-center gap-2">
                {running && (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
                )}

                <p className="text-xs font-black uppercase tracking-wide text-white/70">
                  {getPhaseLabel(
                    phase,
                  )}
                </p>
              </div>
            </div>

            <span
              className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wide ${
                phase ===
                "finished"
                  ? "bg-white/10 text-zinc-400"
                  : running
                    ? "bg-red-500/15 text-red-300"
                    : "bg-white/10 text-white/60"
              }`}
            >
              {running
                ? "En directo"
                : phase ===
                    "halftime"
                  ? "Pausado"
                  : phase ===
                      "finished"
                    ? "Final"
                    : "Preparado"}
            </span>
          </div>
        </div>

        {/* CRONÓMETRO */}
        <div className="px-5 pb-5 pt-6 text-center">
          <p className="font-mono text-6xl font-black tracking-tighter">
            {formatClock(
              displaySeconds,
            )}
          </p>

          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
            {getClockSubtitle(
              phase,
            )}
          </p>

          {/* MARCADOR */}
          <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-3">
            <p className="text-right text-sm font-black leading-5">
              {homeTeam}
            </p>

            <div className="rounded-xl bg-white/10 px-3 py-2">
              {hasResult ? (
                <p className="whitespace-nowrap text-xl font-black">
                  {homeScore}

                  <span className="mx-2 text-zinc-600">
                    -
                  </span>

                  {awayScore}
                </p>
              ) : (
                <p className="text-xs font-black text-zinc-500">
                  VS
                </p>
              )}
            </div>

            <p className="text-left text-sm font-black leading-5">
              {awayTeam}
            </p>
          </div>

          {/* BOTONES DEL PARTIDO */}
          <div className="mt-6">
            {phase ===
              "not_started" && (
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() =>
                  execute(
                    startLiveMatchAction,
                  )
                }
                className="flex min-h-14 w-full items-center justify-center rounded-[1.1rem] bg-[#d8f36a] px-5 text-base font-black text-zinc-950 transition active:scale-[0.99] disabled:opacity-50"
              >
                {pending
                  ? "Iniciando..."
                  : "▶ Iniciar partido"}
              </button>
            )}

            {phase ===
              "first_half" && (
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() =>
                  execute(
                    setLiveHalftimeAction,
                  )
                }
                className="flex min-h-14 w-full items-center justify-center rounded-[1.1rem] bg-white px-5 text-base font-black text-zinc-950 transition active:scale-[0.99] disabled:opacity-50"
              >
                {pending
                  ? "Guardando..."
                  : "⏸ Ir al descanso"}
              </button>
            )}

            {phase ===
              "halftime" && (
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() =>
                  execute(
                    startLiveSecondHalfAction,
                  )
                }
                className="flex min-h-14 w-full items-center justify-center rounded-[1.1rem] bg-[#d8f36a] px-5 text-base font-black text-zinc-950 transition active:scale-[0.99] disabled:opacity-50"
              >
                {pending
                  ? "Iniciando..."
                  : "▶ Iniciar 2ª parte"}
              </button>
            )}

            {phase ===
              "second_half" && (
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={
                  openFinalScore
                }
                className="flex min-h-14 w-full items-center justify-center rounded-[1.1rem] bg-red-600 px-5 text-base font-black text-white transition active:scale-[0.99] disabled:opacity-50"
              >
                ■ Finalizar partido
              </button>
            )}

            {phase ===
              "finished" && (
              <div className="space-y-3">
                <div className="rounded-[1.1rem] bg-white/5 px-4 py-4">
                  <p className="font-black text-white">
                    Partido finalizado
                  </p>

                  <p className="mt-1 text-xs text-zinc-500">
                    El cronómetro está detenido.
                  </p>

                  {hasResult && (
                    <p className="mt-3 text-2xl font-black text-white">
                      {homeScore}
                      {" - "}
                      {awayScore}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  disabled={
                    pending
                  }
                  onClick={() => {
                    const confirmed =
                      window.confirm(
                        "¿Quieres reiniciar el partido? Se borrarán marcador, eventos y estadísticas del partido.",
                      );

                    if (!confirmed) {
                      return;
                    }

                    execute(
                      resetLiveMatchAction,
                    );
                  }}
                  className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-white px-4 text-sm font-black text-zinc-950 disabled:opacity-50"
                >
                  {pending
                    ? "Reiniciando..."
                    : "↻ Reiniciar partido"}
                </button>
              </div>
            )}
          </div>

          {/* PORTERÍA A CERO */}
          {localManagedTeams.length >
            0 && (
            <div className="mt-4 rounded-[1.15rem] bg-white/5 p-3 text-left ring-1 ring-white/10">
              <div className="flex items-center gap-2">
                <span className="text-base">
                  🧤
                </span>

                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                  Portería a cero
                </p>
              </div>

              <div className="mt-2 space-y-2">
                {localManagedTeams.map(
                  (
                    team,
                  ) => (
                    <div
                      key={
                        team.id
                      }
                      className="flex items-center justify-between gap-3 rounded-xl bg-black/20 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-black text-white">
                          {team.name}
                        </p>

                        <p className="mt-0.5 text-[9px] font-semibold text-zinc-500">
                          {team.cleanSheet
                            ? "Activada"
                            : "Desactivada"}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={
                          pending
                        }
                        onClick={() =>
                          changeCleanSheet(
                            team.id,
                            !team.cleanSheet,
                          )
                        }
                        aria-pressed={
                          team.cleanSheet
                        }
                        aria-label={
                          team.cleanSheet
                            ? `Desactivar portería a cero de ${team.name}`
                            : `Activar portería a cero de ${team.name}`
                        }
                        className={`relative h-8 w-14 shrink-0 rounded-full transition disabled:opacity-50 ${
                          team.cleanSheet
                            ? "bg-[#d8f36a]"
                            : "bg-white/15"
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow transition-all ${
                            team.cleanSheet
                              ? "left-7"
                              : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  ),
                )}
              </div>
            </div>
          )}

          {/* MENSAJES */}
          {message &&
            messageType && (
              <div
                role={
                  messageType ===
                  "error"
                    ? "alert"
                    : "status"
                }
                className={`mt-4 rounded-xl px-4 py-3 text-left text-xs font-bold ${
                  messageType ===
                  "error"
                    ? "bg-red-500/15 text-red-300"
                    : "bg-emerald-500/15 text-emerald-300"
                }`}
              >
                {message}
              </div>
            )}
        </div>
      </section>

      {/* MODAL RESULTADO FINAL */}
      {finalScoreOpen && (
        <div
          className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4"
          onClick={() => {
            if (
              !pending
            ) {
              setFinalScoreOpen(
                false,
              );
            }
          }}
        >
          <div
            className="w-full max-w-xl rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem]"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            {/* CABECERA */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Final del partido
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                  Resultado final
                </h2>

                <p className="mt-1 text-sm leading-5 text-zinc-500">
                  Introduce el marcador antes de cerrar el partido.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() =>
                  setFinalScoreOpen(
                    false,
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-black text-zinc-700 disabled:opacity-40"
              >
                ×
              </button>
            </div>

            {/* RESULTADO */}
            <div className="mt-6 grid grid-cols-[1fr_auto_1fr] items-start gap-3">
              <ScoreEditor
                teamName={
                  homeTeam
                }
                value={
                  finalHomeScore
                }
                onChange={
                  setFinalHomeScore
                }
              />

              <div className="pt-14 text-2xl font-black text-zinc-300">
                -
              </div>

              <ScoreEditor
                teamName={
                  awayTeam
                }
                value={
                  finalAwayScore
                }
                onChange={
                  setFinalAwayScore
                }
              />
            </div>

            {/* PREVISUALIZACIÓN */}
            <div className="mt-5 rounded-[1.3rem] bg-zinc-950 p-4 text-center text-white">
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                Marcador final
              </p>

              <p className="mt-2 text-4xl font-black">
                {finalHomeScore}

                <span className="mx-4 text-zinc-600">
                  -
                </span>

                {finalAwayScore}
              </p>
            </div>

            {finalScoreError && (
              <p
                role="alert"
                className="mt-4 rounded-xl bg-red-50 p-3 text-sm font-bold text-red-700"
              >
                {finalScoreError}
              </p>
            )}

            {/* ACCIONES */}
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() =>
                  setFinalScoreOpen(
                    false,
                  )
                }
                className="flex min-h-13 items-center justify-center rounded-[1rem] bg-zinc-100 px-4 text-sm font-black text-zinc-700 disabled:opacity-40"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  pending
                }
                onClick={
                  confirmFinalScore
                }
                className="flex min-h-13 items-center justify-center rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white disabled:opacity-50"
              >
                {pending
                  ? "Finalizando..."
                  : "✓ Guardar y finalizar"}
              </button>
            </div>

            <p className="mt-4 text-center text-[10px] leading-4 text-zinc-400">
              Al confirmar se cerrará el cronómetro y se calcularán los minutos definitivos.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ScoreEditor({
  teamName,
  value,
  onChange,
}: {
  teamName: string;

  value: number;

  onChange: (
    value: number,
  ) => void;
}) {
  function normalize(
    nextValue: number,
  ) {
    if (
      !Number.isFinite(
        nextValue,
      )
    ) {
      onChange(
        0,
      );

      return;
    }

    onChange(
      Math.min(
        99,
        Math.max(
          0,
          Math.trunc(
            nextValue,
          ),
        ),
      ),
    );
  }

  return (
    <div className="min-w-0 text-center">
      <p className="min-h-10 text-xs font-black leading-4 text-zinc-950">
        {teamName}
      </p>

      <div className="mt-3 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() =>
            normalize(
              value -
                1,
            )
          }
          disabled={
            value <=
            0
          }
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-xl font-black text-zinc-700 disabled:opacity-30"
          aria-label={`Restar gol a ${teamName}`}
        >
          −
        </button>

        <input
          type="number"
          inputMode="numeric"
          min={0}
          max={99}
          step={1}
          value={
            value
          }
          onChange={(
            event,
          ) => {
            const parsed =
              Number(
                event.target.value,
              );

            normalize(
              parsed,
            );
          }}
          className="h-14 min-w-0 w-full rounded-xl border-0 bg-zinc-50 px-1 text-center text-3xl font-black text-zinc-950 outline-none ring-1 ring-zinc-200 focus:ring-2 focus:ring-[#0f3d2e]"
          aria-label={`Goles de ${teamName}`}
        />

        <button
          type="button"
          onClick={() =>
            normalize(
              value +
                1,
            )
          }
          disabled={
            value >=
            99
          }
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-xl font-black text-white disabled:opacity-30"
          aria-label={`Sumar gol a ${teamName}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function calculateDisplaySeconds(
  phase: LiveMatchPhase,
  storedSeconds: number,
  startedAt:
    | string
    | null,
): number {
  if (
    (
      phase !==
        "first_half" &&
      phase !==
        "second_half"
    ) ||
    !startedAt
  ) {
    return storedSeconds;
  }

  const start =
    new Date(
      startedAt,
    ).getTime();

  if (
    !Number.isFinite(
      start,
    )
  ) {
    return storedSeconds;
  }

  const elapsed =
    Math.max(
      0,
      Math.floor(
        (
          Date.now() -
          start
        ) /
          1000,
      ),
    );

  return (
    storedSeconds +
    elapsed
  );
}

function formatClock(
  seconds: number,
): string {
  const safeSeconds =
    Math.max(
      0,
      seconds,
    );

  const minutes =
    Math.floor(
      safeSeconds /
        60,
    );

  const remainingSeconds =
    safeSeconds %
    60;

  return `${String(
    minutes,
  ).padStart(
    2,
    "0",
  )}:${String(
    remainingSeconds,
  ).padStart(
    2,
    "0",
  )}`;
}

function getPhaseLabel(
  phase: LiveMatchPhase,
): string {
  switch (phase) {
    case "first_half":
      return "1ª parte";

    case "halftime":
      return "Descanso";

    case "second_half":
      return "2ª parte";

    case "finished":
      return "Finalizado";

    default:
      return "Partido preparado";
  }
}

function getClockSubtitle(
  phase: LiveMatchPhase,
): string {
  switch (phase) {
    case "first_half":
      return "Primera parte";

    case "halftime":
      return "Tiempo detenido";

    case "second_half":
      return "Segunda parte";

    case "finished":
      return "Tiempo final";

    default:
      return "Cronómetro";
  }
}