"use client";

import {
  useMemo,
  useState,
  useTransition,
} from "react";

import {
  updateMatchPlayerStarterAction,
} from "@/app/admin/actions";

import StatsForm from "./stats-form";

type StatsPlayer = {
  entryId: string;
  playerId: string;
  name: string;
  shirtNumber: number | null;
  position: string;
  teamId: string;
  teamName: string;

  starter: boolean;
  statsCompleted: boolean;

  minutesPlayed: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  cleanSheet: boolean;
};

type FieldLine =
  | "GK"
  | "DEF"
  | "MID"
  | "FWD";

function getFieldLine(
  position: string,
): FieldLine {
  if (position === "GK") {
    return "GK";
  }

  if (
    position === "RB" ||
    position === "CB" ||
    position === "LB" ||
    position === "RWB" ||
    position === "LWB"
  ) {
    return "DEF";
  }

  if (
    position === "DM" ||
    position === "CM" ||
    position === "AM"
  ) {
    return "MID";
  }

  return "FWD";
}

export default function StatsManager({
  matchId,
  players,
}: {
  matchId: string;
  players: StatsPlayer[];
}) {
  const [
    localPlayers,
    setLocalPlayers,
  ] = useState(players);

  const [
    selectedEntryId,
    setSelectedEntryId,
  ] = useState<string | null>(
    null,
  );

  const [
    openSlot,
    setOpenSlot,
  ] = useState<{
    teamId: string;
    line: FieldLine;
  } | null>(
    null,
  );

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    pending,
    startTransition,
  ] = useTransition();

  const teams =
    useMemo(
      () =>
        Array.from(
          new Map(
            localPlayers.map(
              (player) => [
                player.teamId,
                player.teamName,
              ],
            ),
          ),
        ),
      [localPlayers],
    );

  const selectedPlayer =
    localPlayers.find(
      (player) =>
        player.entryId ===
        selectedEntryId,
    ) ?? null;

  function saveStarter(
    player: StatsPlayer,
    starter: boolean,
  ) {
    setErrorMessage("");

    setLocalPlayers(
      (current) =>
        current.map(
          (item) =>
            item.entryId ===
            player.entryId
              ? {
                  ...item,
                  starter,
                }
              : item,
        ),
    );

    startTransition(
      async () => {
        const result =
          await updateMatchPlayerStarterAction(
            matchId,
            player.entryId,
            starter,
          );

        if (
          result.status ===
          "error"
        ) {
          setLocalPlayers(
            (current) =>
              current.map(
                (item) =>
                  item.entryId ===
                  player.entryId
                    ? {
                        ...item,
                        starter:
                          player.starter,
                      }
                    : item,
              ),
          );

          setErrorMessage(
            result.message,
          );
        }
      },
    );
  }

  function addStarter(
    player: StatsPlayer,
  ) {
    const teamStarters =
      localPlayers.filter(
        (item) =>
          item.teamId ===
            player.teamId &&
          item.starter,
      ).length;

    if (
      teamStarters >= 11
    ) {
      setErrorMessage(
        `Ya hay 11 titulares seleccionados en ${player.teamName}.`,
      );

      return;
    }

    if (
      getFieldLine(
        player.position,
      ) === "GK"
    ) {
      const goalkeeperExists =
        localPlayers.some(
          (item) =>
            item.teamId ===
              player.teamId &&
            item.starter &&
            getFieldLine(
              item.position,
            ) === "GK",
        );

      if (
        goalkeeperExists
      ) {
        setErrorMessage(
          "Ya hay un portero titular seleccionado.",
        );

        return;
      }
    }

    saveStarter(
      player,
      true,
    );

    setOpenSlot(
      null,
    );
  }

  function removeStarter(
    player: StatsPlayer,
  ) {
    saveStarter(
      player,
      false,
    );
  }

  function markStatsCompleted(
    entryId: string,
  ) {
    setLocalPlayers(
      (current) =>
        current.map(
          (player) =>
            player.entryId ===
            entryId
              ? {
                  ...player,
                  statsCompleted:
                    true,
                }
              : player,
        ),
    );
  }

  return (
    <div className="space-y-10">
      {errorMessage && (
        <p
          role="alert"
          className="rounded-[1.2rem] bg-red-50 p-4 text-sm font-bold text-red-700"
        >
          {errorMessage}
        </p>
      )}

      {teams.map(
        ([
          teamId,
          teamName,
        ]) => {
          const teamPlayers =
            localPlayers.filter(
              (player) =>
                player.teamId ===
                teamId,
            );

          const starters =
            teamPlayers.filter(
              (player) =>
                player.starter,
            );

          const substitutes =
            teamPlayers.filter(
              (player) =>
                !player.starter,
            );

          const startersByLine: Record<
            FieldLine,
            StatsPlayer[]
          > = {
            GK: [],
            DEF: [],
            MID: [],
            FWD: [],
          };

          for (
            const player of
            starters
          ) {
            startersByLine[
              getFieldLine(
                player.position,
              )
            ].push(
              player,
            );
          }

          const canAddStarter =
            starters.length < 11;

          return (
            <section
              key={
                teamId
              }
            >
              <div className="flex items-end justify-between px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                    Once inicial
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                    {teamName}
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Selecciona los titulares directamente desde el campo
                  </p>
                </div>

                <span
                  className={`rounded-full px-4 py-2 text-xs font-black ${
                    starters.length ===
                    11
                      ? "bg-[#e8f2ed] text-[#0f3d2e]"
                      : "bg-white text-zinc-500 ring-1 ring-black/5"
                  }`}
                >
                  {
                    starters.length
                  }
                  /11
                </span>
              </div>

              <div className="mt-4 overflow-hidden rounded-[1.7rem] bg-[#087443] p-2.5 shadow-xl ring-1 ring-black/10">
                <div
                  className="relative min-h-[560px] overflow-hidden rounded-[1.35rem] border-2 border-white/70"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(255,255,255,0.045) 50%, transparent 50%)",
                    backgroundSize:
                      "64px 64px",
                  }}
                >
                  <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/60" />

                  <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

                  <div className="absolute left-1/2 top-0 h-16 w-40 -translate-x-1/2 border-x-2 border-b-2 border-white/60" />

                  <div className="absolute bottom-0 left-1/2 h-16 w-40 -translate-x-1/2 border-x-2 border-t-2 border-white/60" />

                  <div className="relative z-10 flex min-h-[560px] flex-col justify-between px-2 py-5">
                    <StarterRow
                      players={
                        startersByLine.FWD
                      }
                      showAdd={
                        canAddStarter
                      }
                      label="DEL"
                      onAdd={() =>
                        setOpenSlot({
                          teamId,
                          line: "FWD",
                        })
                      }
                      onOpen={
                        setSelectedEntryId
                      }
                    />

                    <StarterRow
                      players={
                        startersByLine.MID
                      }
                      showAdd={
                        canAddStarter
                      }
                      label="MED"
                      onAdd={() =>
                        setOpenSlot({
                          teamId,
                          line: "MID",
                        })
                      }
                      onOpen={
                        setSelectedEntryId
                      }
                    />

                    <StarterRow
                      players={
                        startersByLine.DEF
                      }
                      showAdd={
                        canAddStarter
                      }
                      label="DEF"
                      onAdd={() =>
                        setOpenSlot({
                          teamId,
                          line: "DEF",
                        })
                      }
                      onOpen={
                        setSelectedEntryId
                      }
                    />

                    <StarterRow
                      players={
                        startersByLine.GK
                      }
                      showAdd={
                        startersByLine.GK
                          .length === 0
                      }
                      label="POR"
                      onAdd={() =>
                        setOpenSlot({
                          teamId,
                          line: "GK",
                        })
                      }
                      onOpen={
                        setSelectedEntryId
                      }
                    />
                  </div>
                </div>
              </div>

              <p className="mt-3 px-1 text-xs leading-5 text-zinc-500">
                Pulsa sobre cualquier jugador del campo para editar sus estadísticas.
              </p>

              <div className="mt-8 flex items-end justify-between px-1">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                    Plantilla
                  </p>

                  <h3 className="mt-1 text-xl font-black text-zinc-950">
                    Banquillo
                  </h3>

                  <p className="mt-1 text-xs text-zinc-500">
                    Pulsa un jugador para registrar sus estadísticas
                  </p>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-zinc-500 shadow-sm ring-1 ring-black/5">
                  {
                    substitutes.length
                  }
                </span>
              </div>

              {substitutes.length ===
              0 ? (
                <div className="mt-4 rounded-[1.4rem] bg-white p-5 text-sm text-zinc-500 shadow-sm ring-1 ring-black/5">
                  No quedan jugadores en el banquillo.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-[1.5rem] bg-white shadow-sm ring-1 ring-black/5">
                  {substitutes.map(
                    (
                      player,
                    ) => (
                      <BenchPlayer
                        key={
                          player.entryId
                        }
                        player={
                          player
                        }
                        pending={
                          pending
                        }
                        onOpen={() =>
                          setSelectedEntryId(
                            player.entryId,
                          )
                        }
                        onAddStarter={() =>
                          addStarter(
                            player,
                          )
                        }
                      />
                    ),
                  )}
                </div>
              )}
            </section>
          );
        },
      )}

      {openSlot &&
        (() => {
          const available =
            localPlayers.filter(
              (player) =>
                player.teamId ===
                  openSlot.teamId &&
                !player.starter &&
                getFieldLine(
                  player.position,
                ) ===
                  openSlot.line,
            );

          const title =
            openSlot.line ===
            "GK"
              ? "Porteros"
              : openSlot.line ===
                  "DEF"
                ? "Defensas"
                : openSlot.line ===
                    "MID"
                  ? "Centrocampistas"
                  : "Delanteros";

          return (
            <div
              className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
              onClick={() =>
                setOpenSlot(
                  null,
                )
              }
            >
              <div
                className="max-h-[78vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-[#f5f6f4] p-5 shadow-2xl sm:rounded-[2rem]"
                onClick={(
                  event,
                ) =>
                  event.stopPropagation()
                }
              >
                <div className="flex items-end justify-between px-1">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                      Once inicial
                    </p>

                    <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                      Seleccionar titular
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                      {title}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setOpenSlot(
                        null,
                      )
                    }
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xl font-black text-zinc-700 shadow-sm ring-1 ring-black/5"
                  >
                    ×
                  </button>
                </div>

                <div className="mt-5 space-y-2">
                  {available.length ===
                  0 ? (
                    <p className="rounded-[1.2rem] bg-white p-4 text-sm text-zinc-500 ring-1 ring-black/5">
                      No hay jugadores disponibles para esta posición.
                    </p>
                  ) : (
                    available.map(
                      (
                        player,
                      ) => (
                        <button
                          key={
                            player.entryId
                          }
                          type="button"
                          disabled={
                            pending
                          }
                          onClick={() =>
                            addStarter(
                              player,
                            )
                          }
                          className="flex min-h-16 w-full items-center justify-between rounded-[1.2rem] bg-white px-4 text-left shadow-sm ring-1 ring-black/5 disabled:opacity-50"
                        >
                          <div className="flex items-center gap-3">
                            <PlayerNumber
                              player={
                                player
                              }
                            />

                            <div>
                              <p className="font-black text-zinc-950">
                                {
                                  player.name
                                }
                              </p>

                              <p className="mt-1 text-xs font-semibold text-zinc-400">
                                {
                                  player.position
                                }
                              </p>
                            </div>
                          </div>

                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-950 text-lg font-black text-white">
                            +
                          </span>
                        </button>
                      ),
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      {selectedPlayer && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
          onClick={() =>
            setSelectedEntryId(
              null,
            )
          }
        >
          <div
            className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-white p-5 shadow-2xl sm:rounded-[2rem]"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <PlayerNumber
                  player={
                    selectedPlayer
                  }
                  large
                />

                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                    Estadísticas
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                    {
                      selectedPlayer.name
                    }
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    {
                      selectedPlayer.position
                    }
                    {" · "}
                    {
                      selectedPlayer.teamName
                    }
                  </p>

                  <span
                    className={`mt-2 inline-flex rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${
                      selectedPlayer.starter
                        ? "bg-[#e8f2ed] text-[#0f3d2e]"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {selectedPlayer.starter
                      ? "Titular"
                      : "Suplente"}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedEntryId(
                    null,
                  )
                }
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xl font-black text-zinc-700"
              >
                ×
              </button>
            </div>

            <StatsForm
              key={
                selectedPlayer.entryId
              }
              matchId={
                matchId
              }
              entryId={
                selectedPlayer.entryId
              }
              starter={
                selectedPlayer.starter
              }
              minutesPlayed={
                selectedPlayer.minutesPlayed
              }
              goals={
                selectedPlayer.goals
              }
              assists={
                selectedPlayer.assists
              }
              yellowCards={
                selectedPlayer.yellowCards
              }
              redCards={
                selectedPlayer.redCards
              }
              cleanSheet={
                selectedPlayer.cleanSheet
              }
              onSaved={() =>
                markStatsCompleted(
                  selectedPlayer.entryId,
                )
              }
            />

            {selectedPlayer.starter && (
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() => {
                  removeStarter(
                    selectedPlayer,
                  );

                  setSelectedEntryId(
                    null,
                  );
                }}
                className="mt-4 min-h-12 w-full rounded-[1rem] bg-red-50 px-4 font-black text-red-700 disabled:opacity-50"
              >
                Quitar del once inicial
              </button>
            )}

            {!selectedPlayer.starter && (
              <button
                type="button"
                disabled={
                  pending
                }
                onClick={() => {
                  addStarter(
                    selectedPlayer,
                  );

                  setSelectedEntryId(
                    null,
                  );
                }}
                className="mt-4 min-h-12 w-full rounded-[1rem] bg-zinc-100 px-4 font-black text-zinc-950 disabled:opacity-50"
              >
                Añadir al once inicial
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StarterRow({
  players,
  showAdd,
  label,
  onAdd,
  onOpen,
}: {
  players: StatsPlayer[];
  showAdd: boolean;
  label: string;
  onAdd: () => void;
  onOpen: (
    entryId: string,
  ) => void;
}) {
  const slots =
    players.length +
    (showAdd ? 1 : 0);

  if (slots === 0) {
    return (
      <div className="h-16" />
    );
  }

  return (
    <div
      className="grid items-start justify-items-center gap-1"
      style={{
        gridTemplateColumns:
          `repeat(${slots}, minmax(0, 1fr))`,
      }}
    >
      {players.map(
        (
          player,
        ) => (
          <button
            key={
              player.entryId
            }
            type="button"
            onClick={() =>
              onOpen(
                player.entryId,
              )
            }
            className="flex w-full max-w-[88px] flex-col items-center text-center"
          >
            <PlayerNumber
              player={
                player
              }
            />

            <span className="mt-1 max-w-full truncate rounded-md bg-zinc-950/85 px-2 py-1 text-[9px] font-black text-white shadow-sm">
              {
                player.name
              }
            </span>

            <span className="mt-1 text-[8px] font-bold text-white/75">
              {
                player.position
              }
            </span>
          </button>
        ),
      )}

      {showAdd && (
        <button
          type="button"
          onClick={
            onAdd
          }
          className="flex w-full max-w-[82px] flex-col items-center"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-xl font-black text-white backdrop-blur-sm">
            +
          </div>

          <span className="mt-1 text-[9px] font-black text-white/70">
            {
              label
            }
          </span>
        </button>
      )}
    </div>
  );
}

function BenchPlayer({
  player,
  pending,
  onOpen,
  onAddStarter,
}: {
  player: StatsPlayer;
  pending: boolean;
  onOpen: () => void;
  onAddStarter: () => void;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-zinc-100 p-4 last:border-b-0">
      <button
        type="button"
        onClick={
          onOpen
        }
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <PlayerNumber
          player={
            player
          }
        />

        <div className="min-w-0">
          <p className="truncate font-black text-zinc-950">
            {
              player.name
            }
          </p>

          <div className="mt-1 flex items-center gap-2 text-xs text-zinc-500">
            <span>
              {
                player.position
              }
            </span>

            {player.statsCompleted && (
              <>
                <span>
                  ·
                </span>

                <span className="font-bold text-[#0f3d2e]">
                  Estadísticas guardadas
                </span>
              </>
            )}
          </div>
        </div>
      </button>

      <button
        type="button"
        disabled={
          pending
        }
        onClick={
          onAddStarter
        }
        className="shrink-0 rounded-xl bg-[#e8f2ed] px-3 py-2 text-xs font-black text-[#0f3d2e] disabled:opacity-50"
      >
        + XI
      </button>
    </div>
  );
}

function PlayerNumber({
  player,
  large = false,
}: {
  player: StatsPlayer;
  large?: boolean;
}) {
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full font-black shadow-md ${
        large
          ? "h-14 w-14 text-lg"
          : "h-12 w-12"
      } ${
        player.statsCompleted
          ? "bg-[#0f3d2e] text-white"
          : "bg-white text-[#0f5e3d]"
      }`}
    >
      {player.shirtNumber ??
        "—"}

      {player.statsCompleted && (
        <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[11px] font-black text-[#0f3d2e] shadow">
          ✓
        </span>
      )}
    </div>
  );
}