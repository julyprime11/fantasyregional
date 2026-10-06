"use client";

import Link from "next/link";

import {
  useMemo,
  useState,
} from "react";

import {
  getFantasyLine,
  validateFantasyLineup,
  type PlayerPosition,
} from "@regional-fantasy/shared";

type Player = {
  id: string;

  firstName: string;

  lastName:
    string | null;

  shirtNumber:
    number | null;

  position:
    PlayerPosition;

  imageUrl:
    string | null;
};

type Props = {
  leagueId: string;

  matchId: string;

  players: Player[];

  initialSelectedIds:
    string[];

  locked: boolean;
};

type Formation = {
  name: string;

  defenders: number;

  midfielders: number;

  forwards: number;
};

type FieldLine =
  | "GK"
  | "DEF"
  | "MID"
  | "FWD";

const FORMATIONS: Formation[] = [
  {
    name:
      "4-3-3",

    defenders:
      4,

    midfielders:
      3,

    forwards:
      3,
  },

  {
    name:
      "4-4-2",

    defenders:
      4,

    midfielders:
      4,

    forwards:
      2,
  },

  {
    name:
      "3-5-2",

    defenders:
      3,

    midfielders:
      5,

    forwards:
      2,
  },

  {
    name:
      "3-4-3",

    defenders:
      3,

    midfielders:
      4,

    forwards:
      3,
  },

  {
    name:
      "5-3-2",

    defenders:
      5,

    midfielders:
      3,

    forwards:
      2,
  },

  {
    name:
      "5-4-1",

    defenders:
      5,

    midfielders:
      4,

    forwards:
      1,
  },

  {
    name:
      "4-5-1",

    defenders:
      4,

    midfielders:
      5,

    forwards:
      1,
  },
];

export default function LineupForm({
  leagueId,
  matchId,
  players,
  initialSelectedIds,
  locked,
}: Props) {
  const initialPlayers =
    players.filter(
      (
        player,
      ) =>
        initialSelectedIds.includes(
          player.id,
        ),
    );

  const initialValidation =
    validateFantasyLineup(
      initialPlayers.map(
        (
          player,
        ) => ({
          id:
            player.id,

          position:
            player.position,
        }),
      ),
    );

  const inferredFormation =
    initialValidation.counts.total ===
      11 &&
    initialValidation.counts.goalkeepers ===
      1
      ? FORMATIONS.find(
          (
            formation,
          ) =>
            formation.defenders ===
              initialValidation
                .counts
                .defenders &&
            formation.midfielders ===
              initialValidation
                .counts
                .midfielders &&
            formation.forwards ===
              initialValidation
                .counts
                .forwards,
        )
      : undefined;

  const [
    selectedFormation,
    setSelectedFormation,
  ] =
    useState<Formation>(
      inferredFormation ??
        FORMATIONS[0],
    );

  const [
    selectedIds,
    setSelectedIds,
  ] =
    useState<
      string[]
    >(
      initialSelectedIds,
    );

  const [
    openSlot,
    setOpenSlot,
  ] =
    useState<
      FieldLine | null
    >(
      null,
    );

  const [
    showSquad,
    setShowSquad,
  ] =
    useState(
      false,
    );

  const [
    pending,
    setPending,
  ] =
    useState(
      false,
    );

  const [
    message,
    setMessage,
  ] =
    useState(
      "",
    );

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState(
      "",
    );

  const selectedPlayers =
    useMemo(
      () =>
        players.filter(
          (
            player,
          ) =>
            selectedIds.includes(
              player.id,
            ),
        ),
      [
        players,
        selectedIds,
      ],
    );

  const validation =
    validateFantasyLineup(
      selectedPlayers.map(
        (
          player,
        ) => ({
          id:
            player.id,

          position:
            player.position,
        }),
      ),
    );

  const selectedByLine =
    useMemo(
      () => {
        const result = {
          GK:
            [] as Player[],

          DEF:
            [] as Player[],

          MID:
            [] as Player[],

          FWD:
            [] as Player[],
        };

        for (
          const player of
          selectedPlayers
        ) {
          const line =
            getFantasyLine(
              player.position,
            );

          result[
            line
          ].push(
            player,
          );
        }

        return result;
      },
      [
        selectedPlayers,
      ],
    );

  const groupedPlayers =
    useMemo(
      () => {
        const result = {
          GK:
            [] as Player[],

          DEF:
            [] as Player[],

          MID:
            [] as Player[],

          FWD:
            [] as Player[],
        };

        for (
          const player of
          players
        ) {
          const line =
            getFantasyLine(
              player.position,
            );

          result[
            line
          ].push(
            player,
          );
        }

        return result;
      },
      [
        players,
      ],
    );

  const availableForSlot =
    openSlot ===
    null
      ? []
      : groupedPlayers[
          openSlot
        ].filter(
          (
            player,
          ) =>
            !selectedIds.includes(
              player.id,
            ),
        );

  function canUseFormation(
    formation:
      Formation,
  ) {
    return (
      selectedByLine
        .GK
        .length <=
        1 &&
      selectedByLine
        .DEF
        .length <=
        formation.defenders &&
      selectedByLine
        .MID
        .length <=
        formation.midfielders &&
      selectedByLine
        .FWD
        .length <=
        formation.forwards
    );
  }

  function changeFormation(
    formation:
      Formation,
  ) {
    if (locked) {
      return;
    }

    if (
      !canUseFormation(
        formation,
      )
    ) {
      setErrorMessage(
        "La alineación actual tiene más jugadores de los permitidos para esa formación. Quita algún jugador antes de cambiar.",
      );

      return;
    }

    setSelectedFormation(
      formation,
    );

    setErrorMessage(
      "",
    );

    setMessage(
      "",
    );
  }

  function togglePlayer(
    player:
      Player,
  ) {
    if (locked) {
      return;
    }

    const alreadySelected =
      selectedIds.includes(
        player.id,
      );

    if (
      alreadySelected
    ) {
      setSelectedIds(
        (
          current,
        ) =>
          current.filter(
            (
              id,
            ) =>
              id !==
              player.id,
          ),
      );

      setMessage(
        "",
      );

      setErrorMessage(
        "",
      );

      return;
    }

    if (
      selectedIds.length >=
      11
    ) {
      setErrorMessage(
        "Ya tienes 11 jugadores seleccionados.",
      );

      return;
    }

    const line =
      getFantasyLine(
        player.position,
      );

    const limits = {
      GK:
        1,

      DEF:
        selectedFormation.defenders,

      MID:
        selectedFormation.midfielders,

      FWD:
        selectedFormation.forwards,
    };

    if (
      selectedByLine[
        line
      ].length >=
      limits[
        line
      ]
    ) {
      setErrorMessage(
        `Ya has completado los puestos de ${
          line ===
          "GK"
            ? "portero"
            : line ===
                "DEF"
              ? "defensa"
              : line ===
                  "MID"
                ? "centrocampo"
                : "delantera"
        } para la formación ${selectedFormation.name}.`,
      );

      return;
    }

    setSelectedIds(
      (
        current,
      ) => [
        ...current,
        player.id,
      ],
    );

    setMessage(
      "",
    );

    setErrorMessage(
      "",
    );
  }

  async function saveLineup() {
    setPending(
      true,
    );

    setMessage(
      "",
    );

    setErrorMessage(
      "",
    );

    try {
      const response =
        await fetch(
          "/api/fantasy/lineups/save",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                leagueId,

                matchId,

                playerIds:
                  selectedIds,
              }),
          },
        );

      const result =
        await response.json();

      if (
        !response.ok
      ) {
        setErrorMessage(
          result.message ??
            "No se pudo guardar la alineación.",
        );

        setPending(
          false,
        );

        return;
      }

      setMessage(
        "Alineación guardada correctamente.",
      );
    } catch {
      setErrorMessage(
        "No se pudo guardar la alineación.",
      );
    }

    setPending(
      false,
    );
  }

  return (
    <section className="mt-2.5">
      {/* FORMACIÓN */}
      <div className="flex items-center justify-between gap-3 px-0.5">
        <div>
          <p className="text-[7px] font-black uppercase tracking-[0.16em] text-[#0f3d2e]">
            Táctica
          </p>

          <h2 className="text-[15px] font-black leading-5 tracking-tight text-zinc-950">
            Formación
          </h2>
        </div>

        <span className="rounded-full bg-[#0f3d2e] px-2.5 py-1 text-[10px] font-black text-white">
          {
            selectedFormation.name
          }
        </span>
      </div>

      {/* SELECTOR DE FORMACIÓN */}
      <div className="hide-scrollbar mt-1.5 flex gap-1.5 overflow-x-auto pb-1">
        {FORMATIONS.map(
          (
            formation,
          ) => (
            <button
              key={
                formation.name
              }
              type="button"
              disabled={
                locked
              }
              onClick={() =>
                changeFormation(
                  formation,
                )
              }
              className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black transition ${
                selectedFormation.name ===
                formation.name
                  ? "bg-zinc-950 text-white shadow-sm"
                  : "bg-white text-zinc-600 ring-1 ring-black/5"
              } disabled:opacity-40`}
            >
              {
                formation.name
              }
            </button>
          ),
        )}
      </div>

      {/* CAMPO */}
      <div className="mt-1.5 overflow-hidden rounded-[1.3rem] bg-[#087443] p-1.5 shadow-lg ring-1 ring-black/10">
        <div
          className="relative h-[382px] overflow-hidden rounded-[1rem] border-2 border-white/70 sm:h-[500px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.045) 50%, transparent 50%)",

            backgroundSize:
              "48px 48px",
          }}
        >
          {/* LÍNEA DE MEDIO CAMPO */}
          <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/60" />

          {/* CÍRCULO CENTRAL */}
          <div className="absolute left-1/2 top-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />

          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />

          {/* ÁREA SUPERIOR */}
          <div className="absolute left-1/2 top-0 h-10 w-28 -translate-x-1/2 border-x-2 border-b-2 border-white/60" />

          <div className="absolute left-1/2 top-0 h-5 w-14 -translate-x-1/2 border-x-2 border-b-2 border-white/50" />

          {/* ÁREA INFERIOR */}
          <div className="absolute bottom-0 left-1/2 h-10 w-28 -translate-x-1/2 border-x-2 border-t-2 border-white/60" />

          <div className="absolute bottom-0 left-1/2 h-5 w-14 -translate-x-1/2 border-x-2 border-t-2 border-white/50" />

          {/* JUGADORES */}
          <div className="relative z-10 flex h-full flex-col justify-between px-1 py-2.5 sm:py-5">
            <FieldRow
              players={
                selectedByLine.FWD
              }
              slots={
                selectedFormation.forwards
              }
              label="FWD"
              onRemove={
                togglePlayer
              }
              onAdd={() =>
                setOpenSlot(
                  "FWD",
                )
              }
              locked={
                locked
              }
            />

            <FieldRow
              players={
                selectedByLine.MID
              }
              slots={
                selectedFormation.midfielders
              }
              label="MID"
              onRemove={
                togglePlayer
              }
              onAdd={() =>
                setOpenSlot(
                  "MID",
                )
              }
              locked={
                locked
              }
            />

            <FieldRow
              players={
                selectedByLine.DEF
              }
              slots={
                selectedFormation.defenders
              }
              label="DEF"
              onRemove={
                togglePlayer
              }
              onAdd={() =>
                setOpenSlot(
                  "DEF",
                )
              }
              locked={
                locked
              }
            />

            <FieldRow
              players={
                selectedByLine.GK
              }
              slots={
                1
              }
              label="GK"
              onRemove={
                togglePlayer
              }
              onAdd={() =>
                setOpenSlot(
                  "GK",
                )
              }
              locked={
                locked
              }
            />
          </div>
        </div>
      </div>

      {/* RESUMEN */}
      <div className="mt-2 grid grid-cols-5 gap-1">
        <Counter
          label="POR"
          value={
            selectedByLine
              .GK
              .length
          }
          target={
            1
          }
        />

        <Counter
          label="DEF"
          value={
            selectedByLine
              .DEF
              .length
          }
          target={
            selectedFormation.defenders
          }
        />

        <Counter
          label="MED"
          value={
            selectedByLine
              .MID
              .length
          }
          target={
            selectedFormation.midfielders
          }
        />

        <Counter
          label="DEL"
          value={
            selectedByLine
              .FWD
              .length
          }
          target={
            selectedFormation.forwards
          }
        />

        <div
          className={`rounded-lg px-1 py-1.5 text-center ring-1 ${
            selectedIds.length ===
            11
              ? "bg-[#0f3d2e] text-white ring-[#0f3d2e]"
              : "bg-zinc-950 text-white ring-zinc-950"
          }`}
        >
          <p className="text-xs font-black leading-4">
            {
              selectedIds.length
            }

            <span className="text-[7px] opacity-60">
              /11
            </span>
          </p>

          <p className="text-[6px] font-black uppercase tracking-wide opacity-60">
            XI
          </p>
        </div>
      </div>

      {/* MENSAJES */}
      {errorMessage && (
        <p className="mt-2 rounded-[0.9rem] bg-red-50 p-2.5 text-xs font-medium text-red-700">
          {
            errorMessage
          }
        </p>
      )}

      {message && (
        <p className="mt-2 rounded-[0.9rem] bg-green-50 p-2.5 text-xs font-medium text-green-700">
          {
            message
          }
        </p>
      )}

      {/* PLANTILLA COMPLETA */}
      <button
        type="button"
        onClick={() =>
          setShowSquad(
            (
              current,
            ) =>
              !current,
          )
        }
        className="mt-2 flex min-h-10 w-full items-center justify-between rounded-[1rem] bg-white px-3 text-xs font-black text-zinc-950 shadow-sm ring-1 ring-black/5"
      >
        <span>
          {showSquad
            ? "Ocultar plantilla"
            : "Ver todos los jugadores"}
        </span>

        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-[10px]">
          {showSquad
            ? "↑"
            : "↓"}
        </span>
      </button>

      {showSquad && (
        <div>
          <PlayerSection
            title="Porteros"
            players={
              groupedPlayers.GK
            }
            selectedIds={
              selectedIds
            }
            onToggle={
              togglePlayer
            }
            locked={
              locked
            }
          />

          <PlayerSection
            title="Defensas"
            players={
              groupedPlayers.DEF
            }
            selectedIds={
              selectedIds
            }
            onToggle={
              togglePlayer
            }
            locked={
              locked
            }
          />

          <PlayerSection
            title="Centrocampistas"
            players={
              groupedPlayers.MID
            }
            selectedIds={
              selectedIds
            }
            onToggle={
              togglePlayer
            }
            locked={
              locked
            }
          />

          <PlayerSection
            title="Delanteros"
            players={
              groupedPlayers.FWD
            }
            selectedIds={
              selectedIds
            }
            onToggle={
              togglePlayer
            }
            locked={
              locked
            }
          />
        </div>
      )}

      {/* POPUP DE SELECCIÓN */}
      {openSlot && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/45 backdrop-blur-[2px] sm:items-center"
          onClick={() =>
            setOpenSlot(
              null,
            )
          }
        >
          <div
            className="max-h-[78vh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] bg-[#f5f6f4] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-[2rem]"
            onClick={(
              event,
            ) =>
              event.stopPropagation()
            }
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Mi XI
                </p>

                <h2 className="mt-1 text-xl font-black text-zinc-950">
                  Seleccionar jugador
                </h2>

                <p className="mt-1 text-xs text-zinc-500">
                  {openSlot ===
                    "GK" &&
                    "Porteros disponibles"}

                  {openSlot ===
                    "DEF" &&
                    "Defensas disponibles"}

                  {openSlot ===
                    "MID" &&
                    "Centrocampistas disponibles"}

                  {openSlot ===
                    "FWD" &&
                    "Delanteros disponibles"}
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

            <div className="mt-4 space-y-2">
              {availableForSlot.length ===
              0 ? (
                <p className="rounded-[1.2rem] bg-white p-4 text-sm text-zinc-500 ring-1 ring-black/5">
                  No hay más jugadores disponibles para esta posición.
                </p>
              ) : (
                availableForSlot.map(
                  (
                    player,
                  ) => (
                    <div
                      key={
                        player.id
                      }
                      className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/5"
                    >
                      <Link
                        href={`/players/${player.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3 transition active:opacity-70"
                      >
                        {player.imageUrl ? (
                          <div
                            className="h-11 min-w-11 rounded-xl bg-[#e8f2ed] bg-cover bg-center shadow-sm"
                            style={{
                              backgroundImage:
                                `url("${player.imageUrl}")`,
                            }}
                          />
                        ) : (
                          <span className="flex h-11 min-w-11 items-center justify-center rounded-xl bg-[#e8f2ed] text-sm font-black text-[#0f3d2e]">
                            {
                              player.shirtNumber ??
                              "—"
                            }
                          </span>
                        )}

                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-zinc-950">
                            {
                              player.firstName
                            }{" "}
                            {
                              player.lastName ??
                              ""
                            }
                          </p>

                          <p className="mt-0.5 text-[10px] font-medium text-zinc-400">
                            {
                              player.position
                            }
                          </p>
                        </div>
                      </Link>

                      <button
                        type="button"
                        disabled={
                          locked
                        }
                        onClick={() => {
                          togglePlayer(
                            player,
                          );

                          setOpenSlot(
                            null,
                          );
                        }}
                        aria-label={`Añadir a ${player.firstName} al XI`}
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-lg font-black text-white transition active:scale-95 disabled:opacity-40"
                      >
                        +
                      </button>
                    </div>
                  ),
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* GUARDAR */}
      <div className="sticky bottom-[calc(72px+env(safe-area-inset-bottom))] z-30 -mx-4 mt-3 border-t border-zinc-200 bg-[#f5f6f4]/95 px-4 py-2 backdrop-blur">
        {locked ? (
          <div className="flex min-h-11 items-center justify-center rounded-[0.95rem] bg-zinc-200 px-4 text-center text-xs font-black text-zinc-600">
            🔒 Alineación bloqueada
          </div>
        ) : (
          <button
            type="button"
            onClick={
              saveLineup
            }
            disabled={
              pending ||
              !validation.valid ||
              selectedIds.length !==
                11
            }
            className="min-h-11 w-full rounded-[0.95rem] bg-[#0f3d2e] px-4 text-xs font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-40"
          >
            {pending
              ? "Guardando..."
              : `Guardar Mi XI · ${selectedFormation.name}`}
          </button>
        )}
      </div>
    </section>
  );
}

function FieldRow({
  players,
  slots,
  label,
  onRemove,
  onAdd,
  locked,
}: {
  players:
    Player[];

  slots:
    number;

  label:
    FieldLine;

  onRemove:
    (
      player:
        Player,
    ) => void;

  onAdd:
    () => void;

  locked:
    boolean;
}) {
  const labels = {
    GK:
      "POR",

    DEF:
      "DEF",

    MID:
      "MED",

    FWD:
      "DEL",
  };

  return (
    <div
      className="grid items-start justify-items-center gap-0"
      style={{
        gridTemplateColumns:
          `repeat(${slots}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({
        length:
          slots,
      }).map(
        (
          _,
          index,
        ) => {
          const player =
            players[
              index
            ];

          if (
            !player
          ) {
            return (
              <button
                key={`empty-${label}-${index}`}
                type="button"
                disabled={
                  locked
                }
                onClick={
                  onAdd
                }
                className="flex w-full max-w-[58px] flex-col items-center disabled:opacity-60"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-base font-black text-white backdrop-blur-sm">
                  +
                </div>

                <span className="mt-0.5 text-[6px] font-black text-white/70">
                  {
                    labels[
                      label
                    ]
                  }
                </span>
              </button>
            );
          }

          const name =
            player.lastName ??
            player.firstName;

          return (
            <div
              key={
                player.id
              }
              className="relative flex w-full max-w-[62px] flex-col items-center"
            >
              <Link
                href={`/players/${player.id}`}
                className="flex w-full flex-col items-center transition active:scale-95"
                title={`Ver perfil de ${player.firstName} ${player.lastName ?? ""}`}
              >
                <div className="relative">
                  {player.imageUrl ? (
                    <div
                      className="h-11 w-11 rounded-full bg-white bg-cover bg-center shadow-md ring-2 ring-white/70 sm:h-14 sm:w-14"
                      style={{
                        backgroundImage:
                          `url("${player.imageUrl}")`,
                      }}
                    />
                  ) : (
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[12px] font-black text-[#0f5e3d] shadow-md ring-2 ring-white/30 sm:h-14 sm:w-14">
                      {
                        player.shirtNumber ??
                        "•"
                      }
                    </div>
                  )}

                  {player.imageUrl &&
                    player.shirtNumber !==
                      null && (
                      <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#0f3d2e] px-1 text-[6px] font-black text-white shadow ring-1 ring-white">
                        {
                          player.shirtNumber
                        }
                      </span>
                    )}
                </div>

                <span className="mt-0.5 max-w-full truncate rounded bg-zinc-950/85 px-1 py-[1px] text-[6px] font-black leading-3 text-white shadow-sm sm:text-[9px]">
                  {
                    name
                  }
                </span>

                <span className="text-[6px] font-bold leading-3 text-white/70">
                  {
                    player.position
                  }
                </span>
              </Link>

              {!locked && (
                <button
                  type="button"
                  onClick={() =>
                    onRemove(
                      player,
                    )
                  }
                  aria-label={`Quitar a ${player.firstName} del XI`}
                  className="absolute -right-1 -top-1 z-20 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow ring-2 ring-white"
                >
                  ×
                </button>
              )}
            </div>
          );
        },
      )}
    </div>
  );
}

function PlayerSection({
  title,
  players,
  selectedIds,
  onToggle,
  locked,
}: {
  title:
    string;

  players:
    Player[];

  selectedIds:
    string[];

  onToggle:
    (
      player:
        Player,
    ) => void;

  locked:
    boolean;
}) {
  return (
    <section className="mt-5">
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-base font-black text-zinc-950">
          {
            title
          }
        </h3>

        <span className="text-[10px] font-bold text-zinc-400">
          {
            players.length
          }
        </span>
      </div>

      <div className="space-y-2">
        {players.map(
          (
            player,
          ) => {
            const selected =
              selectedIds.includes(
                player.id,
              );

            return (
              <div
                key={
                  player.id
                }
                className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-[1rem] px-3 py-2 shadow-sm ring-1 transition ${
                  selected
                    ? "bg-[#0f3d2e] text-white ring-[#0f3d2e]"
                    : "bg-white text-zinc-950 ring-black/5"
                }`}
              >
                <Link
                  href={`/players/${player.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 transition active:opacity-70"
                >
                  {player.imageUrl ? (
                    <div
                      className={`h-11 min-w-11 rounded-xl bg-cover bg-center shadow-sm ${
                        selected
                          ? "ring-2 ring-white/30"
                          : "ring-1 ring-black/5"
                      }`}
                      style={{
                        backgroundImage:
                          `url("${player.imageUrl}")`,
                      }}
                    />
                  ) : (
                    <span
                      className={`flex h-11 min-w-11 items-center justify-center rounded-xl text-sm font-black ${
                        selected
                          ? "bg-white/15 text-white"
                          : "bg-[#e8f2ed] text-[#0f3d2e]"
                      }`}
                    >
                      {
                        player.shirtNumber ??
                        "—"
                      }
                    </span>
                  )}

                  <div className="min-w-0">
                    <p className="truncate text-sm font-black">
                      {
                        player.firstName
                      }{" "}
                      {
                        player.lastName ??
                        ""
                      }
                    </p>

                    <p
                      className={`mt-0.5 text-[10px] font-medium ${
                        selected
                          ? "text-white/60"
                          : "text-zinc-400"
                      }`}
                    >
                      {
                        player.position
                      }
                    </p>
                  </div>
                </Link>

                <button
                  type="button"
                  disabled={
                    locked
                  }
                  onClick={() =>
                    onToggle(
                      player,
                    )
                  }
                  aria-label={
                    selected
                      ? `Quitar a ${player.firstName} del XI`
                      : `Añadir a ${player.firstName} al XI`
                  }
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black transition active:scale-95 ${
                    selected
                      ? "bg-white text-[#0f3d2e]"
                      : "bg-zinc-100 text-zinc-500"
                  } disabled:opacity-40`}
                >
                  {selected
                    ? "✓"
                    : "+"}
                </button>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}

function Counter({
  label,
  value,
  target,
}: {
  label:
    string;

  value:
    number;

  target:
    number;
}) {
  const complete =
    value ===
    target;

  return (
    <div
      className={`rounded-lg px-1 py-1.5 text-center ring-1 ${
        complete
          ? "bg-[#e8f2ed] text-[#0f3d2e] ring-[#d7e8df]"
          : "bg-white text-zinc-950 ring-black/5"
      }`}
    >
      <p className="text-xs font-black leading-4">
        {
          value
        }
        /
        {
          target
        }
      </p>

      <p
        className={`text-[6px] font-black uppercase tracking-wide ${
          complete
            ? "text-[#557368]"
            : "text-zinc-400"
        }`}
      >
        {
          label
        }
      </p>
    </div>
  );
}