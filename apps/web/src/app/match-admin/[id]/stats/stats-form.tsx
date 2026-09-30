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
  status: "idle",
  message: "",
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
  }, [onSaved]);

  useEffect(() => {
    if (
      state.status ===
      "success"
    ) {
      onSavedRef.current?.();
    }
  }, [state.status]);

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

  return (
    <form
      action={
        formAction
      }
      className="mt-5 space-y-4"
    >
      {starter && (
        <input
          type="hidden"
          name="starter"
          value="on"
        />
      )}

      {/* MINUTOS */}
      <section className="rounded-[1.4rem] bg-zinc-50 p-4">
        <div className="mb-3">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
            Participación
          </p>

          <h3 className="mt-1 font-black text-zinc-950">
            Minutos jugados
          </h3>
        </div>

        <QuickNumberField
          name="minutes_played"
          label="Minutos"
          value={minutes}
          onChange={
            setMinutes
          }
          max={120}
          quickValues={[
            0,
            15,
            30,
            45,
            60,
            75,
            90,
          ]}
          large
        />
      </section>

      {/* RENDIMIENTO */}
      <section>
        <p className="px-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
          Rendimiento
        </p>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <StatBox
            icon="⚽"
            title="Goles"
          >
            <QuickNumberField
              name="goals"
              label="Goles"
              value={
                goalsValue
              }
              onChange={
                setGoalsValue
              }
            />
          </StatBox>

          <StatBox
            icon="👟"
            title="Asistencias"
          >
            <QuickNumberField
              name="assists"
              label="Asistencias"
              value={
                assistsValue
              }
              onChange={
                setAssistsValue
              }
            />
          </StatBox>

          <StatBox
            icon="🟨"
            title="Amarillas"
          >
            <QuickNumberField
              name="yellow_cards"
              label="Amarillas"
              value={
                yellowValue
              }
              onChange={
                setYellowValue
              }
            />
          </StatBox>

          <StatBox
            icon="🟥"
            title="Rojas"
          >
            <QuickNumberField
              name="red_cards"
              label="Rojas"
              value={
                redValue
              }
              onChange={
                setRedValue
              }
            />
          </StatBox>
        </div>
      </section>

      {/* PORTERÍA CERO */}
      <label className="flex min-h-16 cursor-pointer items-center justify-between rounded-[1.3rem] bg-[#e8f2ed] px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0f3d2e] text-white">
            🧤
          </div>

          <div>
            <p className="font-black text-[#0b2f23]">
              Portería a cero
            </p>

            <p className="mt-0.5 text-[10px] font-semibold text-[#557368]">
              Aplicable según posición
            </p>
          </div>
        </div>

        <input
          type="checkbox"
          name="clean_sheet"
          defaultChecked={
            cleanSheet
          }
          className="h-6 w-6 accent-[#0f3d2e]"
        />
      </label>

      {/* ESTADO */}
      {state.status !==
        "idle" && (
        <div
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`rounded-[1.2rem] p-4 ${
            state.status ===
            "error"
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <p
            className={`text-sm font-bold ${
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

      <button
        type="submit"
        disabled={
          pending
        }
        className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending
          ? "Guardando..."
          : "Guardar estadísticas →"}
      </button>
    </form>
  );
}

function StatBox({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.3rem] bg-zinc-50 p-3">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg">
          {icon}
        </span>

        <p className="text-xs font-black text-zinc-700">
          {title}
        </p>
      </div>

      {children}
    </div>
  );
}

function QuickNumberField({
  name,
  label,
  value,
  onChange,
  max,
  quickValues,
  large = false,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (
    value: number,
  ) => void;
  max?: number;
  quickValues?: number[];
  large?: boolean;
}) {
  function decrease() {
    onChange(
      Math.max(
        0,
        value - 1,
      ),
    );
  }

  function increase() {
    const next =
      value + 1;

    if (
      max !==
      undefined
    ) {
      onChange(
        Math.min(
          max,
          next,
        ),
      );

      return;
    }

    onChange(
      next,
    );
  }

  function setSafeValue(
    nextValue: number,
  ) {
    let safe =
      Math.max(
        0,
        nextValue,
      );

    if (
      max !==
      undefined
    ) {
      safe =
        Math.min(
          max,
          safe,
        );
    }

    onChange(
      safe,
    );
  }

  return (
    <div>
      <div
        className={`grid items-center gap-2 ${
          large
            ? "grid-cols-[56px_1fr_56px]"
            : "grid-cols-[42px_1fr_42px]"
        }`}
      >
        <button
          type="button"
          onClick={
            decrease
          }
          className={`rounded-xl bg-white font-black text-zinc-950 shadow-sm ring-1 ring-black/5 active:scale-95 ${
            large
              ? "h-14 text-2xl"
              : "h-11 text-xl"
          }`}
          aria-label={`Restar ${label}`}
        >
          −
        </button>

        <input
          type="number"
          name={
            name
          }
          min={0}
          max={
            max
          }
          step={1}
          required
          value={
            value
          }
          onChange={(
            event,
          ) =>
            setSafeValue(
              Number(
                event.target
                  .value,
              ),
            )
          }
          inputMode="numeric"
          className={`w-full rounded-xl border-0 bg-white px-2 text-center font-black text-zinc-950 outline-none ring-1 ring-black/5 focus:ring-[#0f3d2e] ${
            large
              ? "h-14 text-2xl"
              : "h-11 text-xl"
          }`}
        />

        <button
          type="button"
          onClick={
            increase
          }
          className={`rounded-xl bg-white font-black text-zinc-950 shadow-sm ring-1 ring-black/5 active:scale-95 ${
            large
              ? "h-14 text-2xl"
              : "h-11 text-xl"
          }`}
          aria-label={`Sumar ${label}`}
        >
          +
        </button>
      </div>

      {quickValues && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {quickValues.map(
            (
              quickValue,
            ) => (
              <button
                key={
                  quickValue
                }
                type="button"
                onClick={() =>
                  setSafeValue(
                    quickValue,
                  )
                }
                className={`min-h-10 rounded-xl px-2 text-xs font-black ${
                  value ===
                  quickValue
                    ? "bg-[#0f3d2e] text-white"
                    : "bg-white text-zinc-500 ring-1 ring-black/5"
                }`}
              >
                {
                  quickValue
                }
                &apos;
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}