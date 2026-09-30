"use client";

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
  lastName: string | null;
  shirtNumber: number | null;
  position: PlayerPosition;
};

type Props = {
  leagueId: string;
  matchId: string;
  players: Player[];
  initialSelectedIds: string[];
  locked: boolean;
};

type Formation = {
  name: string;
  defenders: number;
  midfielders: number;
  forwards: number;
};

type FieldLine = "GK" | "DEF" | "MID" | "FWD";

const FORMATIONS: Formation[] = [
  { name: "4-3-3", defenders: 4, midfielders: 3, forwards: 3 },
  { name: "4-4-2", defenders: 4, midfielders: 4, forwards: 2 },
  { name: "3-5-2", defenders: 3, midfielders: 5, forwards: 2 },
  { name: "3-4-3", defenders: 3, midfielders: 4, forwards: 3 },
  { name: "5-3-2", defenders: 5, midfielders: 3, forwards: 2 },
  { name: "5-4-1", defenders: 5, midfielders: 4, forwards: 1 },
  { name: "4-5-1", defenders: 4, midfielders: 5, forwards: 1 },
];

export default function LineupForm({
  leagueId,
  matchId,
  players,
  initialSelectedIds,
  locked,
}: Props) {
  const initialPlayers =
    players.filter((player) =>
      initialSelectedIds.includes(player.id),
    );

  const initialValidation =
    validateFantasyLineup(
      initialPlayers.map((player) => ({
        id: player.id,
        position: player.position,
      })),
    );

  const inferredFormation =
    initialValidation.counts.total === 11 &&
    initialValidation.counts.goalkeepers === 1
      ? FORMATIONS.find(
          (formation) =>
            formation.defenders === initialValidation.counts.defenders &&
            formation.midfielders === initialValidation.counts.midfielders &&
            formation.forwards === initialValidation.counts.forwards,
        )
      : undefined;

  const [selectedFormation, setSelectedFormation] =
    useState<Formation>(
      inferredFormation ?? FORMATIONS[0],
    );

  const [selectedIds, setSelectedIds] =
    useState<string[]>(
      initialSelectedIds,
    );

  const [openSlot, setOpenSlot] =
    useState<FieldLine | null>(
      null,
    );

  const [showSquad, setShowSquad] =
    useState(false);

  const [pending, setPending] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  const selectedPlayers =
    useMemo(
      () =>
        players.filter((player) =>
          selectedIds.includes(player.id),
        ),
      [players, selectedIds],
    );

  const validation =
    validateFantasyLineup(
      selectedPlayers.map((player) => ({
        id: player.id,
        position: player.position,
      })),
    );

  const selectedByLine =
    useMemo(() => {
      const result = {
        GK: [] as Player[],
        DEF: [] as Player[],
        MID: [] as Player[],
        FWD: [] as Player[],
      };

      for (const player of selectedPlayers) {
        const line = getFantasyLine(player.position);
        result[line].push(player);
      }

      return result;
    }, [selectedPlayers]);

  const groupedPlayers =
    useMemo(() => {
      const result = {
        GK: [] as Player[],
        DEF: [] as Player[],
        MID: [] as Player[],
        FWD: [] as Player[],
      };

      for (const player of players) {
        const line = getFantasyLine(player.position);
        result[line].push(player);
      }

      return result;
    }, [players]);

  const availableForSlot =
    openSlot === null
      ? []
      : groupedPlayers[openSlot].filter(
          (player) =>
            !selectedIds.includes(player.id),
        );

  function canUseFormation(
    formation: Formation,
  ) {
    return (
      selectedByLine.GK.length <= 1 &&
      selectedByLine.DEF.length <= formation.defenders &&
      selectedByLine.MID.length <= formation.midfielders &&
      selectedByLine.FWD.length <= formation.forwards
    );
  }

  function changeFormation(
    formation: Formation,
  ) {
    if (locked) return;

    if (!canUseFormation(formation)) {
      setErrorMessage(
        "La alineación actual tiene más jugadores de los permitidos para esa formación. Quita algún jugador antes de cambiar.",
      );
      return;
    }

    setSelectedFormation(formation);
    setErrorMessage("");
    setMessage("");
  }

  function togglePlayer(
    player: Player,
  ) {
    if (locked) return;

    const alreadySelected =
      selectedIds.includes(player.id);

    if (alreadySelected) {
      setSelectedIds((current) =>
        current.filter((id) => id !== player.id),
      );

      setMessage("");
      setErrorMessage("");
      return;
    }

    if (selectedIds.length >= 11) {
      setErrorMessage(
        "Ya tienes 11 jugadores seleccionados.",
      );
      return;
    }

    const line =
      getFantasyLine(player.position);

    const limits = {
      GK: 1,
      DEF: selectedFormation.defenders,
      MID: selectedFormation.midfielders,
      FWD: selectedFormation.forwards,
    };

    if (
      selectedByLine[line].length >=
      limits[line]
    ) {
      setErrorMessage(
        `Ya has completado los puestos de ${
          line === "GK"
            ? "portero"
            : line === "DEF"
              ? "defensa"
              : line === "MID"
                ? "centrocampo"
                : "delantera"
        } para la formación ${selectedFormation.name}.`,
      );
      return;
    }

    setSelectedIds((current) => [
      ...current,
      player.id,
    ]);

    setMessage("");
    setErrorMessage("");
  }

  async function saveLineup() {
    setPending(true);
    setMessage("");
    setErrorMessage("");

    try {
      const response =
        await fetch(
          "/api/fantasy/lineups/save",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              leagueId,
              matchId,
              playerIds: selectedIds,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message ??
            "No se pudo guardar la alineación.",
        );
        setPending(false);
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

    setPending(false);
  }

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-zinc-950">
            Formación
          </h2>

          <p className="text-sm text-zinc-500">
            Elige cómo quieres colocar tu XI
          </p>
        </div>

        <span className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-bold text-white">
          {selectedFormation.name}
        </span>
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-2">
        {FORMATIONS.map((formation) => (
          <button
            key={formation.name}
            type="button"
            disabled={locked}
            onClick={() =>
              changeFormation(formation)
            }
            className={`shrink-0 rounded-xl px-4 py-2 text-sm font-bold ${
              selectedFormation.name === formation.name
                ? "bg-zinc-950 text-white"
                : "bg-white text-zinc-700 ring-1 ring-zinc-200"
            }`}
          >
            {formation.name}
          </button>
        ))}
      </div>

      <div className="mt-5 overflow-hidden rounded-3xl bg-emerald-700 p-3 shadow-lg ring-1 ring-emerald-800">
        <div
          className="relative min-h-[570px] overflow-hidden rounded-2xl border-2 border-white/70"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0.04) 50%, transparent 50%)",
            backgroundSize:
              "72px 72px",
          }}
        >
          <div className="absolute left-0 right-0 top-1/2 border-t-2 border-white/60" />
          <div className="absolute left-1/2 top-1/2 h-20 w-20 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/60" />
          <div className="absolute left-1/2 top-0 h-16 w-40 -translate-x-1/2 border-x-2 border-b-2 border-white/60" />
          <div className="absolute bottom-0 left-1/2 h-16 w-40 -translate-x-1/2 border-x-2 border-t-2 border-white/60" />

          <div className="relative z-10 flex min-h-[570px] flex-col justify-between px-2 py-5">
            <FieldRow
              players={selectedByLine.FWD}
              slots={selectedFormation.forwards}
              label="FWD"
              onRemove={togglePlayer}
              onAdd={() => setOpenSlot("FWD")}
            />

            <FieldRow
              players={selectedByLine.MID}
              slots={selectedFormation.midfielders}
              label="MID"
              onRemove={togglePlayer}
              onAdd={() => setOpenSlot("MID")}
            />

            <FieldRow
              players={selectedByLine.DEF}
              slots={selectedFormation.defenders}
              label="DEF"
              onRemove={togglePlayer}
              onAdd={() => setOpenSlot("DEF")}
            />

            <FieldRow
              players={selectedByLine.GK}
              slots={1}
              label="GK"
              onRemove={togglePlayer}
              onAdd={() => setOpenSlot("GK")}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <Counter
          label="POR"
          value={selectedByLine.GK.length}
          target={1}
        />
        <Counter
          label="DEF"
          value={selectedByLine.DEF.length}
          target={selectedFormation.defenders}
        />
        <Counter
          label="MED"
          value={selectedByLine.MID.length}
          target={selectedFormation.midfielders}
        />
        <Counter
          label="DEL"
          value={selectedByLine.FWD.length}
          target={selectedFormation.forwards}
        />
      </div>

      <div className="mt-3 rounded-xl bg-zinc-950 p-4 text-white">
        <div className="flex items-center justify-between">
          <span className="font-semibold">
            Jugadores seleccionados
          </span>

          <span className="text-2xl font-black">
            {selectedIds.length}/11
          </span>
        </div>
      </div>

      {errorMessage && (
        <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {errorMessage}
        </p>
      )}

      {message && (
        <p className="mt-5 rounded-xl bg-green-50 p-4 text-sm font-medium text-green-700">
          {message}
        </p>
      )}

      <button
        type="button"
        onClick={() =>
          setShowSquad((current) => !current)
        }
        className="mt-6 flex min-h-14 w-full items-center justify-between rounded-2xl bg-white px-5 font-semibold text-zinc-950 shadow-sm ring-1 ring-zinc-200"
      >
        <span>
          {showSquad
            ? "Ocultar plantilla completa"
            : "Ver plantilla completa"}
        </span>

        <span>
          {showSquad ? "↑" : "↓"}
        </span>
      </button>

      {showSquad && (
        <div>
          <PlayerSection
            title="Porteros"
            players={groupedPlayers.GK}
            selectedIds={selectedIds}
            onToggle={togglePlayer}
            locked={locked}
          />

          <PlayerSection
            title="Defensas"
            players={groupedPlayers.DEF}
            selectedIds={selectedIds}
            onToggle={togglePlayer}
            locked={locked}
          />

          <PlayerSection
            title="Centrocampistas"
            players={groupedPlayers.MID}
            selectedIds={selectedIds}
            onToggle={togglePlayer}
            locked={locked}
          />

          <PlayerSection
            title="Delanteros"
            players={groupedPlayers.FWD}
            selectedIds={selectedIds}
            onToggle={togglePlayer}
            locked={locked}
          />
        </div>
      )}

      {openSlot && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center">
          <div className="max-h-[75vh] w-full max-w-xl overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl sm:rounded-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-950">
                  Seleccionar jugador
                </h2>

                <p className="mt-1 text-sm text-zinc-500">
                  {openSlot === "GK" &&
                    "Porteros disponibles"}
                  {openSlot === "DEF" &&
                    "Defensas disponibles"}
                  {openSlot === "MID" &&
                    "Centrocampistas disponibles"}
                  {openSlot === "FWD" &&
                    "Delanteros disponibles"}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOpenSlot(null)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-xl font-bold"
              >
                ×
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {availableForSlot.length === 0 ? (
                <p className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-500">
                  No hay más jugadores disponibles para esta posición.
                </p>
              ) : (
                availableForSlot.map((player) => (
                  <button
                    key={player.id}
                    type="button"
                    onClick={() => {
                      togglePlayer(player);
                      setOpenSlot(null);
                    }}
                    className="flex min-h-16 w-full items-center justify-between rounded-2xl bg-white px-4 text-left shadow-sm ring-1 ring-zinc-200"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 min-w-10 items-center justify-center rounded-xl bg-zinc-100 font-bold">
                        {player.shirtNumber ?? "—"}
                      </span>

                      <div>
                        <p className="font-bold text-zinc-950">
                          {player.firstName}{" "}
                          {player.lastName ?? ""}
                        </p>

                        <p className="text-sm text-zinc-500">
                          {player.position}
                        </p>
                      </div>
                    </div>

                    <span className="text-xl font-bold">
                      +
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-zinc-200 bg-zinc-50/95 p-4 backdrop-blur">
        {locked ? (
          <div className="rounded-xl bg-zinc-200 p-4 text-center font-semibold text-zinc-700">
            Alineación bloqueada
          </div>
        ) : (
          <button
            type="button"
            onClick={saveLineup}
            disabled={
              pending ||
              !validation.valid ||
              selectedIds.length !== 11
            }
            className="min-h-14 w-full rounded-xl bg-zinc-950 px-4 text-lg font-bold text-white disabled:opacity-40"
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
}: {
  players: Player[];
  slots: number;
  label: FieldLine;
  onRemove: (player: Player) => void;
  onAdd: () => void;
}) {
  const labels = {
    GK: "POR",
    DEF: "DEF",
    MID: "MED",
    FWD: "DEL",
  };

  return (
    <div
      className="grid items-start justify-items-center gap-1"
      style={{
        gridTemplateColumns: `repeat(${slots}, minmax(0, 1fr))`,
      }}
    >
      {Array.from({ length: slots }).map((_, index) => {
        const player = players[index];

        if (!player) {
          return (
            <button
              key={`empty-${label}-${index}`}
              type="button"
              onClick={onAdd}
              className="flex w-full max-w-[82px] flex-col items-center"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-white/70 bg-white/10 text-xl font-bold text-white">
                +
              </div>

              <span className="mt-1 text-[10px] font-bold text-white/70">
                {labels[label]}
              </span>
            </button>
          );
        }

        const name =
          player.lastName ??
          player.firstName;

        return (
          <button
            key={player.id}
            type="button"
            onClick={() => onRemove(player)}
            className="flex w-full max-w-[88px] flex-col items-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white font-black text-emerald-800 shadow-md">
              {player.shirtNumber ?? "•"}
            </div>

            <span className="mt-1 max-w-full truncate rounded-md bg-zinc-950/80 px-2 py-1 text-[10px] font-bold text-white">
              {name}
            </span>

            <span className="mt-1 text-[9px] font-semibold text-white/80">
              {player.position}
            </span>
          </button>
        );
      })}
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
  title: string;
  players: Player[];
  selectedIds: string[];
  onToggle: (player: Player) => void;
  locked: boolean;
}) {
  return (
    <section className="mt-6">
      <h3 className="mb-3 text-lg font-bold text-zinc-950">
        {title}
      </h3>

      <div className="space-y-2">
        {players.map((player) => {
          const selected =
            selectedIds.includes(player.id);

          return (
            <button
              key={player.id}
              type="button"
              disabled={locked}
              onClick={() => onToggle(player)}
              className={`flex min-h-16 w-full items-center justify-between rounded-2xl px-4 text-left shadow-sm ring-1 ${
                selected
                  ? "bg-zinc-950 text-white ring-zinc-950"
                  : "bg-white text-zinc-950 ring-zinc-200"
              } disabled:opacity-60`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 min-w-10 items-center justify-center rounded-xl font-bold ${
                    selected
                      ? "bg-white/15"
                      : "bg-zinc-100"
                  }`}
                >
                  {player.shirtNumber ?? "—"}
                </span>

                <div>
                  <p className="font-bold">
                    {player.firstName}{" "}
                    {player.lastName ?? ""}
                  </p>

                  <p
                    className={`text-sm ${
                      selected
                        ? "text-zinc-300"
                        : "text-zinc-500"
                    }`}
                  >
                    {player.position}
                  </p>
                </div>
              </div>

              <span className="text-xl font-bold">
                {selected ? "✓" : "+"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Counter({
  label,
  value,
  target,
}: {
  label: string;
  value: number;
  target: number;
}) {
  const complete =
    value === target;

  return (
    <div
      className={`rounded-xl p-3 text-center shadow-sm ring-1 ${
        complete
          ? "bg-zinc-950 text-white ring-zinc-950"
          : "bg-white text-zinc-950 ring-zinc-200"
      }`}
    >
      <p className="text-xl font-black">
        {value}
      </p>

      <p className="text-xs font-semibold">
        {label}
      </p>

      <p
        className={`mt-1 text-[10px] ${
          complete
            ? "text-zinc-300"
            : "text-zinc-400"
        }`}
      >
        de {target}
      </p>
    </div>
  );
}