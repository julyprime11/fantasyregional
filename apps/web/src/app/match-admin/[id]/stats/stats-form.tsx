"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  updateMatchPlayerAction,
  type FormState,
} from "@/app/admin/actions";

import {
  createBrowserSupabaseClient,
} from "@/lib/supabase/client";

import {
  updateQuickPlayerStatAction,
  updateExtraPlayerStatAction,
  updateMatchRedCardReasonAction,
} from "./actions";

import type {
  QuickStatField,
} from "@/data/match-players";

import {
  FANTASY_EXTRA_STATS,
  FANTASY_EXTRA_STAT_FIELDS,
  type FantasyExtraStatField,
  type FantasyExtraStats,
} from "@regional-fantasy/shared";

type StatsFormProps = {
  matchId: string;

  entryId: string;

  starter: boolean;

  minutesPlayed: number;

  goals: number;

  assists: number;

  yellowCards: number;

  redCards: number;
  redCardReason: string | null;
  cleanSheet: boolean;
  scoringVersion: string;
  isGoalkeeper: boolean;
  extraStats: FantasyExtraStats;

  onSaved?: () => void;
};

const initialState: FormState = {
  status:
    "idle",

  message:
    "",
};

type RealtimeMatchPlayer = {
  minutes_played?: number;

  goals?: number;

  assists?: number;

  yellow_cards?: number;

  red_cards?: number;
  red_card_reason?: string | null;
  clean_sheet?: boolean;

  stats_completed?: boolean;
} & FantasyExtraStats;

type ExtraValues = Record<FantasyExtraStatField, number>;

function normalizeExtraStats(stats: FantasyExtraStats): ExtraValues {
  return Object.fromEntries(
    FANTASY_EXTRA_STAT_FIELDS.map((field) => [field, stats[field] ?? 0]),
  ) as ExtraValues;
}

export default function StatsForm({
  matchId,
  entryId,
  starter,
  minutesPlayed,
  goals,
  assists,
  yellowCards,
  redCards,
  redCardReason,
  cleanSheet,
  scoringVersion,
  isGoalkeeper,
  extraStats,
  onSaved,
}: StatsFormProps) {
  const action =
    updateMatchPlayerAction.bind(
      null,
      matchId,
      entryId,
    );

  const [
    state,
    formAction,
    pending,
  ] =
    useActionState(
      action,
      initialState,
    );

  const onSavedRef =
    useRef(
      onSaved,
    );

  useEffect(() => {
    onSavedRef.current =
      onSaved;
  }, [
    onSaved,
  ]);

  useEffect(() => {
    if (
      state.status ===
      "success"
    ) {
      onSavedRef.current?.();
    }
  }, [
    state.status,
  ]);

  const [
    minutes,
    setMinutes,
  ] =
    useState(
      minutesPlayed,
    );

  const [
    goalsValue,
    setGoalsValue,
  ] =
    useState(
      goals,
    );

  const [
    assistsValue,
    setAssistsValue,
  ] =
    useState(
      assists,
    );

  const [
    yellowValue,
    setYellowValue,
  ] =
    useState(
      yellowCards,
    );

  const [
    redValue,
    setRedValue,
  ] =
    useState(redCards);
  const [redReasonValue, setRedReasonValue] = useState<string | null>(redCardReason);
  const [reasonPending, setReasonPending] = useState(false);
  const [reasonMessage, setReasonMessage] = useState("");

  const [
    cleanSheetValue,
    setCleanSheetValue,
  ] =
    useState(
      cleanSheet,
    );

  const [extraValues, setExtraValues] = useState<ExtraValues>(
    () => normalizeExtraStats(extraStats),
  );

  const [
    quickPendingField,
    setQuickPendingField,
  ] =
    useState<
      QuickStatField | FantasyExtraStatField | null
    >(null);

  const [
    quickError,
    setQuickError,
  ] =
    useState("");

  const [extraError, setExtraError] = useState("");

  const [
    realtimeStatus,
    setRealtimeStatus,
  ] =
    useState<
      | "connecting"
      | "connected"
      | "error"
    >(
      "connecting",
    );

  /*
   * Si llegan nuevos valores desde el padre
   * después de un refresh, sincronizamos
   * el estado local.
   */
  useEffect(() => {
    setMinutes(
      minutesPlayed,
    );
  }, [
    minutesPlayed,
  ]);

  useEffect(() => {
    setGoalsValue(
      goals,
    );
  }, [
    goals,
  ]);

  useEffect(() => {
    setAssistsValue(
      assists,
    );
  }, [
    assists,
  ]);

  useEffect(() => {
    setYellowValue(
      yellowCards,
    );
  }, [
    yellowCards,
  ]);

  useEffect(() => {
    setRedValue(
      redCards,
    );
  }, [
    redCards,
  ]);

  useEffect(() => {
    setCleanSheetValue(
      cleanSheet,
    );
  }, [
    cleanSheet,
  ]);

  useEffect(() => {
    setExtraValues(normalizeExtraStats(extraStats));
  }, [extraStats]);

  /*
   * ===============================
   * REALTIME / MULTIUSUARIO
   * ===============================
   *
   * Al abrir un jugador:
   *
   * 1. Leemos el estado más reciente.
   * 2. Nos suscribimos a cambios.
   *
   * Así, si otro directivo actualiza
   * goles, tarjetas, clean sheet, etc.,
   * este modal recibe el nuevo valor.
   */
  useEffect(() => {
    const supabase =
      createBrowserSupabaseClient();

    let mounted =
      true;

    async function loadLatest() {
      const {
        data,
        error,
      } =
        await supabase
          .from(
            "match_players",
          )
          .select("*")
          .eq(
            "match_id",
            matchId,
          )
          .eq(
            "id",
            entryId,
          )
          .maybeSingle();

      if (
        !mounted
      ) {
        return;
      }

      if (
        error ||
        !data
      ) {
        setRealtimeStatus(
          "error",
        );

        return;
      }

      setMinutes(
        data.minutes_played ??
          0,
      );

      setGoalsValue(
        data.goals ??
          0,
      );

      setAssistsValue(
        data.assists ??
          0,
      );

      setYellowValue(
        data.yellow_cards ??
          0,
      );

      setRedValue(data.red_cards ?? 0);
      setRedReasonValue(data.red_card_reason ?? null);

      setCleanSheetValue(
        data.clean_sheet ??
          false,
      );

      setExtraValues(normalizeExtraStats(data));
    }

    void loadLatest();

    const channel =
      supabase
        .channel(
          `match-player-form-${entryId}`,
        )
        .on(
          "postgres_changes",
          {
            event:
              "UPDATE",

            schema:
              "public",

            table:
              "match_players",

            filter:
              `id=eq.${entryId}`,
          },
          (
            payload,
          ) => {
            const updated =
              payload.new as
                RealtimeMatchPlayer;

            if (
              typeof updated.minutes_played ===
              "number"
            ) {
              setMinutes(
                updated.minutes_played,
              );
            }

            if (
              typeof updated.goals ===
              "number"
            ) {
              setGoalsValue(
                updated.goals,
              );
            }

            if (
              typeof updated.assists ===
              "number"
            ) {
              setAssistsValue(
                updated.assists,
              );
            }

            if (
              typeof updated.yellow_cards ===
              "number"
            ) {
              setYellowValue(
                updated.yellow_cards,
              );
            }

            if (typeof updated.red_cards === "number") {
              setRedValue(updated.red_cards);
            }
            if ("red_card_reason" in updated) {
              setRedReasonValue(updated.red_card_reason ?? null);
            }

            setExtraValues((current) => ({
              ...current,
              ...Object.fromEntries(
                FANTASY_EXTRA_STAT_FIELDS
                  .filter((field) => typeof updated[field] === "number")
                  .map((field) => [field, updated[field]]),
              ),
            }));

            if (
              typeof updated.clean_sheet ===
              "boolean"
            ) {
              setCleanSheetValue(
                updated.clean_sheet,
              );
            }
          },
        )
        .subscribe(
          (
            status,
          ) => {
            if (
              !mounted
            ) {
              return;
            }

            if (
              status ===
              "SUBSCRIBED"
            ) {
              setRealtimeStatus(
                "connected",
              );
            }

            if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT"
            ) {
              setRealtimeStatus(
                "error",
              );
            }
          },
        );

    return () => {
      mounted =
        false;

      void supabase.removeChannel(
        channel,
      );
    };
  }, [
    matchId,
    entryId,
  ]);

  /*
   * ===============================
   * QUICK STATS
   * ===============================
   */
  async function changeQuickStat(
    field: QuickStatField,
    delta: 1 | -1,
  ) {
    if (
      quickPendingField !==
      null
    ) {
      return;
    }

    setQuickError("");

    setQuickPendingField(
      field,
    );

    const result =
      await updateQuickPlayerStatAction(
        matchId,
        entryId,
        field,
        delta,
      );

    setQuickPendingField(
      null,
    );

    if (
      result.status ===
      "error"
    ) {
      setQuickError(
        result.message,
      );

      return;
    }

    if (
      typeof result.value !==
      "number"
    ) {
      return;
    }

    switch (
      field
    ) {
      case "goals":
        setGoalsValue(
          result.value,
        );

        break;

      case "assists":
        setAssistsValue(
          result.value,
        );

        break;

      case "yellow_cards":
        setYellowValue(
          result.value,
        );

        break;

      case "red_cards":
        setRedValue(
          result.value,
        );

        break;
    }
  }


  async function changeExtraStat(field: FantasyExtraStatField, delta: 1 | -1) {
    if (quickPendingField !== null) return;
    setExtraError("");
    setQuickPendingField(field);
    try {
      const result = await updateExtraPlayerStatAction(
        matchId, entryId, field, delta,
      );
      if (result.status === "error") {
        setExtraError(result.message);
        return;
      }
      if (typeof result.value === "number") {
        setExtraValues((current) => ({ ...current, [field]: result.value as number }));
      }
    } catch {
      setExtraError("No se pudo guardar. Comprueba la conexión e inténtalo de nuevo.");
    } finally {
      setQuickPendingField(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {/* ESTADO REALTIME */}
      <div
        className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 ${
          realtimeStatus ===
          "connected"
            ? "bg-[#edf5f1]"
            : realtimeStatus ===
                "error"
              ? "bg-amber-50"
              : "bg-zinc-100"
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`h-2 w-2 rounded-full ${
              realtimeStatus ===
              "connected"
                ? "bg-emerald-500"
                : realtimeStatus ===
                    "error"
                  ? "bg-amber-500"
                  : "animate-pulse bg-zinc-400"
            }`}
          />

          <p
            className={`text-[10px] font-black uppercase tracking-wide ${
              realtimeStatus ===
              "connected"
                ? "text-[#0f3d2e]"
                : realtimeStatus ===
                    "error"
                  ? "text-amber-700"
                  : "text-zinc-500"
            }`}
          >
            {realtimeStatus ===
            "connected"
              ? "Sincronizado en directo"
              : realtimeStatus ===
                  "error"
                ? "Sincronización no disponible"
                : "Conectando..."}
          </p>
        </div>

        {realtimeStatus ===
          "connected" && (
          <span className="text-[9px] font-semibold text-[#557368]">
            Multiusuario
          </span>
        )}
      </div>

      {/* MINUTOS AUTOMÁTICOS */}
      <section className="flex items-center justify-between gap-3 rounded-xl bg-[#e8f2ed] px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <span aria-hidden="true" className="text-lg">⏱</span>
          <div className="min-w-0">
            <p className="text-[11px] font-black text-[#0f3d2e]">Minutos automáticos</p>
            <p className="text-[10px] text-[#557368]">Cronómetro y sustituciones</p>
          </div>
        </div>
        <p className="shrink-0 text-2xl font-black tabular-nums text-[#0f3d2e]">
          {minutes}<span className="ml-0.5 text-sm">&apos;</span>
        </p>
      </section>

      {/* ESTADÍSTICAS RÁPIDAS */}
      <section>
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-black text-zinc-950">Estadísticas rápidas</h3>
          <span className="text-[10px] font-semibold text-zinc-500">Guardado automático</span>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <QuickStatControl
            icon="⚽"
            label="Goles"
            value={
              goalsValue
            }
            pending={
              quickPendingField ===
              "goals"
            }
            disabled={
              quickPendingField !==
              null
            }
            onMinus={() =>
              changeQuickStat(
                "goals",
                -1,
              )
            }
            onPlus={() =>
              changeQuickStat(
                "goals",
                1,
              )
            }
          />

          <QuickStatControl
            icon="👟"
            label="Asistencias"
            value={
              assistsValue
            }
            pending={
              quickPendingField ===
              "assists"
            }
            disabled={
              quickPendingField !==
              null
            }
            onMinus={() =>
              changeQuickStat(
                "assists",
                -1,
              )
            }
            onPlus={() =>
              changeQuickStat(
                "assists",
                1,
              )
            }
          />

          <QuickStatControl
            icon="🟨"
            label="Amarillas"
            value={
              yellowValue
            }
            pending={
              quickPendingField ===
              "yellow_cards"
            }
            disabled={
              quickPendingField !==
              null
            }
            onMinus={() =>
              changeQuickStat(
                "yellow_cards",
                -1,
              )
            }
            onPlus={() =>
              changeQuickStat(
                "yellow_cards",
                1,
              )
            }
          />

          <QuickStatControl
            icon="🟥"
            label="Rojas"
            value={
              redValue
            }
            pending={
              quickPendingField ===
              "red_cards"
            }
            disabled={
              quickPendingField !==
              null
            }
            onMinus={() =>
              changeQuickStat(
                "red_cards",
                -1,
              )
            }
            onPlus={() =>
              changeQuickStat(
                "red_cards",
                1,
              )
            }
          />
        </div>

        {redValue > 0 && (
          <div className="mt-3 rounded-xl border border-red-100 bg-red-50 px-3 py-3">
            <p className="text-xs font-black text-red-800">
              Motivo de la tarjeta roja
            </p>
            <p className="mt-1 text-[11px] text-red-700">
              Indica si fue directa o por segunda amarilla para calcular los puntos.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {([
                ["direct", "Roja directa"],
                ["second_yellow", "Doble amarilla"],
              ] as const).map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  disabled={reasonPending || quickPendingField !== null}
                  aria-pressed={redReasonValue === value}
                  onClick={async () => {
                    setReasonPending(true);
                    setReasonMessage("");
                    const response = await updateMatchRedCardReasonAction(matchId, entryId, value);
                    setReasonPending(false);
                    if (response.status === "success") setRedReasonValue(value);
                    setReasonMessage(response.message);
                  }}
                  className={`min-h-11 rounded-lg px-2 text-xs font-black disabled:opacity-50 ${
                    redReasonValue === value
                      ? "bg-red-800 text-white"
                      : "bg-white text-red-800 ring-1 ring-red-200"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p role="status" className="mt-2 text-[11px] font-semibold text-red-800">
              {reasonPending ? "Guardando motivo..." : reasonMessage || (redReasonValue ? "Motivo registrado" : "Motivo pendiente de registrar")}
            </p>
          </div>
        )}
                {quickError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700"
          >
            {quickError}
          </p>
        )}
      </section>


      {scoringVersion === "v3" && (
        <>
          <section aria-labelledby="fantasy-extra-penalties">
            <h3 id="fantasy-extra-penalties" className="text-base font-black text-zinc-950">
              Penaltis
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FANTASY_EXTRA_STATS
                .filter((stat) => stat.group === "penalties")
                .filter((stat) => stat.field !== "penalties_saved" || isGoalkeeper)
                .map((stat) => (
                  <ExtraStatControl
                    key={stat.field}
                    stat={stat}
                    value={extraValues[stat.field]}
                    disabled={quickPendingField !== null}
                    pending={quickPendingField === stat.field}
                    onMinus={() => changeExtraStat(stat.field, -1)}
                    onPlus={() => changeExtraStat(stat.field, 1)}
                  />
                ))}
            </div>
          </section>

          <section aria-labelledby="fantasy-extra-other">
            <h3 id="fantasy-extra-other" className="text-base font-black text-zinc-950">
              Errores y otras acciones
            </h3>
            <div className="mt-2 space-y-2">
              {FANTASY_EXTRA_STATS
                .filter((stat) => stat.group === "other")
                .map((stat) => (
                  <ExtraStatControl
                    key={stat.field}
                    stat={stat}
                    value={extraValues[stat.field]}
                    disabled={quickPendingField !== null}
                    pending={quickPendingField === stat.field}
                    compact
                    onMinus={() => changeExtraStat(stat.field, -1)}
                    onPlus={() => changeExtraStat(stat.field, 1)}
                  />
                ))}
            </div>
            <p className="mt-2 text-[11px] leading-4 text-zinc-500">
              Los goles en propia puerta deben registrarse también en los eventos
              del partido para actualizar el marcador. Este contador aplica
              exclusivamente la penalización Fantasy al jugador.
            </p>
          </section>
          {extraError && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
              {extraError}
            </p>
          )}
        </>
      )}

      {/* MARCAR COMPLETADO */}
      <form
        action={
          formAction
        }
        className="border-t border-zinc-100 pt-3"
      >
        {/*
         * El parser de la action sigue esperando
         * estos campos.
         *
         * updateMatchPlayerStats() ya no los
         * sobrescribe; únicamente marca
         * stats_completed=true.
         */}

        {starter && (
          <input
            type="hidden"
            name="starter"
            value="on"
          />
        )}

        <input
          type="hidden"
          name="minutes_played"
          value={
            minutes
          }
        />

        <input
          type="hidden"
          name="goals"
          value={
            goalsValue
          }
        />

        <input
          type="hidden"
          name="assists"
          value={
            assistsValue
          }
        />

        <input
          type="hidden"
          name="yellow_cards"
          value={
            yellowValue
          }
        />

        <input
          type="hidden"
          name="red_cards"
          value={
            redValue
          }
        />

        {cleanSheetValue && (
          <input
            type="hidden"
            name="clean_sheet"
            value="on"
          />
        )}

        {state.status !==
          "idle" && (
          <p
            role={
              state.status ===
              "error"
                ? "alert"
                : "status"
            }
            className={`mb-3 rounded-xl p-3 text-sm ${
              state.status ===
              "error"
                ? "bg-red-50 text-red-700"
                : "bg-green-50 text-green-700"
            }`}
          >
            {state.message}
          </p>
        )}

        <button
          type="submit"
          disabled={
            pending
          }
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-50"
        >
          {pending
            ? "Guardando..."
            : "Marcar estadísticas completadas"}
        </button>
      </form>
    </div>
  );
}



type ExtraStatDefinition = (typeof FANTASY_EXTRA_STATS)[number];

function ExtraStatControl({
  stat,
  value,
  pending,
  disabled,
  compact = false,
  onMinus,
  onPlus,
}: {
  stat: ExtraStatDefinition;
  value: number;
  pending: boolean;
  disabled: boolean;
  compact?: boolean;
  onMinus: () => void;
  onPlus: () => void;
}) {
  const [showInfo, setShowInfo] = useState(false);
  const infoId = `fantasy-stat-info-${stat.field}`;
  const pointsLabel = `${stat.points > 0 ? "+" : ""}${stat.points} pts`;

  const controls = (
    <div className={compact
      ? "flex shrink-0 items-center gap-1"
      : "mt-2 grid grid-cols-[36px_minmax(0,1fr)_36px] items-center gap-1.5"
    }>
      <button
        type="button"
        aria-label={`Restar ${stat.label}`}
        disabled={disabled || value <= 0}
        onClick={onMinus}
        className={`flex shrink-0 items-center justify-center rounded-lg bg-white font-black text-zinc-700 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-30 ${compact ? "h-9 w-8 text-base" : "h-10 w-9 text-lg"}`}
      >
        −
      </button>
      <span className={`text-center font-black tabular-nums text-zinc-950 ${compact ? "min-w-6 text-base" : "text-lg"}`}>
        {pending ? "…" : value}
      </span>
      <button
        type="button"
        aria-label={`Sumar ${stat.label}`}
        disabled={disabled || value >= 99}
        onClick={onPlus}
        className={`flex shrink-0 items-center justify-center rounded-lg bg-[#0f3d2e] font-black text-white active:scale-95 disabled:opacity-40 ${compact ? "h-9 w-8 text-base" : "h-10 w-9 text-lg"}`}
      >
        +
      </button>
    </div>
  );

  return (
    <div className="min-w-0 rounded-xl bg-zinc-50 p-2.5 ring-1 ring-black/5">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex min-w-0 flex-1 items-start gap-1.5">
          <span className="shrink-0 text-base" aria-hidden="true">{stat.icon}</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black leading-4 text-zinc-800">
              {stat.label}
            </p>
            <p className="text-[10px] font-semibold text-zinc-500">{pointsLabel}</p>
          </div>
          <button
            type="button"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black text-[#0f3d2e] focus-visible:outline-2 focus-visible:outline-[#0f3d2e]"
            aria-label={`Información sobre ${stat.label}`}
            aria-controls={infoId}
            aria-expanded={showInfo}
            onClick={() => setShowInfo((open) => !open)}
          >
            ⓘ
          </button>
        </div>
        {compact && controls}
      </div>
      {!compact && controls}
      {showInfo && (
        <p id={infoId} role="note" className="mt-2 rounded-lg bg-white p-2 text-[11px] leading-4 text-zinc-600">
          {stat.description}
        </p>
      )}
    </div>
  );
}

function QuickStatControl({
  icon,
  label,
  value,
  pending,
  disabled,
  onMinus,
  onPlus,
}: {
  icon: string;

  label: string;

  value: number;

  pending: boolean;

  disabled: boolean;

  onMinus: () => void;

  onPlus: () => void;
}) {
  return (
    <div className="rounded-xl bg-zinc-50 p-2.5 ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span className="text-base">
          {icon}
        </span>

        <p className="text-xs font-black text-zinc-700">
          {label}
        </p>
      </div>

      <div className="mt-1.5 grid grid-cols-[44px_minmax(0,1fr)_44px] items-center gap-1">
        <button
          type="button"
          disabled={
            disabled ||
            value <= 0
          }
          onClick={
            onMinus
          }
          className="flex h-11 items-center justify-center rounded-lg bg-white text-xl font-black text-zinc-700 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-30"
          aria-label={`Restar ${label}`}
        >
          −
        </button>

        <p className="text-center text-xl font-black tabular-nums text-zinc-950">
          {pending
            ? "…"
            : value}
        </p>

        <button
          type="button"
          disabled={
            disabled
          }
          onClick={
            onPlus
          }
          className="flex h-11 items-center justify-center rounded-lg bg-[#0f3d2e] text-lg font-black text-white active:scale-95 disabled:opacity-40"
          aria-label={`Sumar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}