"use client";

import {
  useActionState,
} from "react";

import type {
  UserRoleState,
} from "./actions";

type Props = {
  action: (
    state: UserRoleState,
    form: FormData,
  ) => Promise<UserRoleState>;

  currentRole:
    | string
    | null;
};

const initialState: UserRoleState = {
  status:
    "idle",

  message:
    "",
};

export default function UserRoleForm({
  action,
  currentRole,
}: Props) {
  const [
    state,
    formAction,
    pending,
  ] =
    useActionState(
      action,
      initialState,
    );

  return (
    <form
      action={formAction}
      className="space-y-3"
    >
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Rol
        </span>

        <select
          name="voter_role"
          defaultValue={
            currentRole ??
            ""
          }
          className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-950 outline-none focus:border-zinc-950"
        >
          <option value="">
            Sin rol
          </option>

          <option value="jugador">
            Jugador Fantasy
          </option>

          <option value="player">
            Jugador equipo
          </option>

          <option value="entrenador">
            Entrenador
          </option>

          <option value="cuerpo_tecnico">
            Cuerpo técnico
          </option>

          <option value="directiva">
            Directiva
          </option>
        </select>
      </label>

      <div className="space-y-2 rounded-xl bg-zinc-50 p-3 text-xs leading-5 text-zinc-500">
        <p>
          <strong className="text-zinc-700">
            Jugador Fantasy:
          </strong>{" "}
          puede crear y unirse a ligas, preparar su XI y consultar sus puntos.
          No puede votar.
        </p>

        <p>
          <strong className="text-zinc-700">
            Jugador equipo:
          </strong>{" "}
          tiene todas las funciones Fantasy y además puede votar los partidos.
        </p>

        <p>
          <strong className="text-zinc-700">
            Entrenador:
          </strong>{" "}
          puede votar los partidos, pero no participa en el Fantasy ni tiene
          acceso administrativo.
        </p>

        <p>
          <strong className="text-zinc-700">
            Cuerpo técnico:
          </strong>{" "}
          puede votar los partidos, pero no participa en el Fantasy ni tiene
          acceso administrativo.
        </p>

        <p>
          <strong className="text-zinc-700">
            Directiva:
          </strong>{" "}
          tiene acceso completo al Fantasy, votaciones, Match Admin y
          administración de clubs, equipos, jugadores, partidos, usuarios y
          sincronización FFCV.
        </p>
      </div>

      <button
        type="submit"
        disabled={
          pending
        }
        className="flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white disabled:opacity-50"
      >
        {pending
          ? "Guardando..."
          : "Guardar rol"}
      </button>

      {state.status !==
        "idle" && (
        <p
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`rounded-xl p-3 text-xs font-medium ${
            state.status ===
            "error"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {
            state.message
          }
        </p>
      )}
    </form>
  );
}