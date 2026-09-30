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
  ] = useActionState(
    action,
    initialState,
  );

  /*
   * Guardamos siempre la versión más reciente del callback
   * sin provocar que el useEffect se ejecute de nuevo cada
   * vez que renderiza el componente padre.
   */
  const onSavedRef =
    useRef(onSaved);

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
  ] = useState(
    minutesPlayed,
  );

  const [
    goalsValue,
    setGoalsValue,
  ] = useState(goals);

  const [
    assistsValue,
    setAssistsValue,
  ] = useState(assists);

  const [
    yellowValue,
    setYellowValue,
  ] = useState(
    yellowCards,
  );

  const [
    redValue,
    setRedValue,
  ] = useState(
    redCards,
  );

  return (
    <form
      action={formAction}
      className="mt-5 space-y-5"
    >
      {starter && (
        <input
          type="hidden"
          name="starter"
          value="on"
        />
      )}

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
      />

      <div className="grid grid-cols-2 gap-3">
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
      </div>

      <label className="flex min-h-14 items-center justify-between rounded-xl bg-zinc-50 px-4">
        <div>
          <p className="font-semibold text-zinc-950">
            Portería a cero
          </p>

          <p className="text-xs text-zinc-500">
            Aplicable según posición
          </p>
        </div>

        <input
          type="checkbox"
          name="clean_sheet"
          defaultChecked={
            cleanSheet
          }
          className="h-6 w-6"
        />
      </label>

      {state.status !==
        "idle" && (
        <p
          role={
            state.status ===
            "error"
              ? "alert"
              : undefined
          }
          className={`rounded-xl p-3 text-sm ${
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
        disabled={pending}
        className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 font-semibold text-white disabled:opacity-50"
      >
        {pending
          ? "Guardando..."
          : "Guardar estadísticas"}
      </button>
    </form>
  );
}

function QuickNumberField({
  name,
  label,
  value,
  onChange,
  max,
  quickValues,
}: {
  name: string;
  label: string;
  value: number;
  onChange: (
    value: number,
  ) => void;
  max?: number;
  quickValues?: number[];
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
      max !== undefined
    ) {
      onChange(
        Math.min(
          max,
          next,
        ),
      );

      return;
    }

    onChange(next);
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
      max !== undefined
    ) {
      safe =
        Math.min(
          max,
          safe,
        );
    }

    onChange(safe);
  }

  return (
    <div className="rounded-xl bg-zinc-50 p-3">
      <p className="mb-3 text-sm font-medium text-zinc-700">
        {label}
      </p>

      <div className="grid grid-cols-[52px_1fr_52px] items-center gap-2">
        <button
          type="button"
          onClick={
            decrease
          }
          className="h-12 rounded-lg border border-zinc-300 bg-white text-2xl font-bold text-zinc-950 active:scale-95"
          aria-label={`Restar ${label}`}
        >
          −
        </button>

        <input
          type="number"
          name={name}
          min={0}
          max={max}
          step={1}
          required
          value={value}
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
          className="h-12 w-full rounded-lg border border-zinc-300 bg-white px-3 text-center text-xl font-bold text-zinc-950 outline-none focus:border-zinc-950"
        />

        <button
          type="button"
          onClick={
            increase
          }
          className="h-12 rounded-lg border border-zinc-300 bg-white text-2xl font-bold text-zinc-950 active:scale-95"
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
                className={`min-h-10 rounded-lg border px-2 text-sm font-semibold ${
                  value ===
                  quickValue
                    ? "border-zinc-950 bg-zinc-950 text-white"
                    : "border-zinc-300 bg-white text-zinc-700"
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