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
} from "./actions";

import type {
  QuickStatField,
} from "@/data/match-players";

type StatsFormProps = {
  matchId: string;

  entryId: string;

  starter: boolean;

  minutesPlayed: number;

  goals: number;

  assists: number;

  yellowCards: number;

  redCards: number;

  cleanSheet: boolean;

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

  clean_sheet?: boolean;

  stats_completed?: boolean;
};

export default function StatsForm({
  matchId,
  entryId,
  starter,
  minutesPlayed,
  goals,
  assists,
  yellowCards,
  redCards,
  cleanSheet,
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
    useState(
      redCards,
    );

  const [
    cleanSheetValue,
    setCleanSheetValue,
  ] =
    useState(
      cleanSheet,
    );

  const [
    quickPendingField,
    setQuickPendingField,
  ] =
    useState<
      QuickStatField | null
    >(null);

  const [
    quickError,
    setQuickError,
  ] =
    useState("");

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
          .select(
            `
              minutes_played,
              goals,
              assists,
              yellow_cards,
              red_cards,
              clean_sheet,
              stats_completed
            `,
          )
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

      setRedValue(
        data.red_cards ??
          0,
      );

      setCleanSheetValue(
        data.clean_sheet ??
          false,
      );
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

            if (
              typeof updated.red_cards ===
              "number"
            ) {
              setRedValue(
                updated.red_cards,
              );
            }

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

  return (
    <div className="mt-5 space-y-5">
      {/* ESTADO REALTIME */}
      <div
        className={`flex items-center justify-between rounded-xl px-3 py-2 ${
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
      <section className="rounded-[1.2rem] bg-[#e8f2ed] p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
          Minutos automáticos
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div>
            <p className="text-3xl font-black text-[#0f3d2e]">
              {minutes}
              <span className="ml-1 text-base">
                &apos;
              </span>
            </p>

            <p className="mt-1 text-xs leading-5 text-[#557368]">
              Se calculan mediante el cronómetro y las sustituciones.
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-white">
            ⏱
          </div>
        </div>
      </section>

      {/* ESTADÍSTICAS RÁPIDAS */}
      <section>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
            En directo
          </p>

          <h3 className="mt-1 text-lg font-black text-zinc-950">
            Estadísticas rápidas
          </h3>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Los cambios se guardan automáticamente y aparecen en los demás dispositivos.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
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

        {quickError && (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700"
          >
            {quickError}
          </p>
        )}
      </section>

      {/* CLEAN SHEET SOLO INFORMATIVO */}
      <section
        className={`rounded-[1.2rem] p-4 ${
          cleanSheetValue
            ? "bg-emerald-50"
            : "bg-zinc-50"
        }`}
      >
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
          Equipo
        </p>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div>
            <p className="font-black text-zinc-950">
              Portería a cero
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Se gestiona para todo el equipo desde la pantalla del partido.
            </p>
          </div>

          <span
            className={`shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black ${
              cleanSheetValue
                ? "bg-emerald-600 text-white"
                : "bg-zinc-200 text-zinc-500"
            }`}
          >
            {cleanSheetValue
              ? "SÍ"
              : "NO"}
          </span>
        </div>
      </section>

      {/* MARCAR COMPLETADO */}
      <form
        action={
          formAction
        }
        className="border-t border-zinc-100 pt-5"
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
          className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 font-semibold text-white disabled:opacity-50"
        >
          {pending
            ? "Guardando..."
            : "Marcar estadísticas como completadas"}
        </button>
      </form>
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
    <div className="rounded-[1.2rem] bg-zinc-50 p-3 ring-1 ring-black/5">
      <div className="flex items-center gap-2">
        <span className="text-base">
          {icon}
        </span>

        <p className="text-xs font-black text-zinc-700">
          {label}
        </p>
      </div>

      <div className="mt-3 grid grid-cols-[38px_1fr_38px] items-center gap-2">
        <button
          type="button"
          disabled={
            disabled ||
            value <= 0
          }
          onClick={
            onMinus
          }
          className="flex h-9 items-center justify-center rounded-lg bg-white text-xl font-black text-zinc-700 shadow-sm ring-1 ring-black/5 active:scale-95 disabled:opacity-30"
          aria-label={`Restar ${label}`}
        >
          −
        </button>

        <p className="text-center text-2xl font-black text-zinc-950">
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
          className="flex h-9 items-center justify-center rounded-lg bg-[#0f3d2e] text-lg font-black text-white active:scale-95 disabled:opacity-40"
          aria-label={`Sumar ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}