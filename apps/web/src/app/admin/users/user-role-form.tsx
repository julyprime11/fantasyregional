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
        <span className="mb-1.5 block text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
          Rol del usuario
        </span>

        <select
          name="voter_role"
          defaultValue={
            currentRole ??
            ""
          }
          className="h-12 w-full rounded-[0.95rem] border-0 bg-zinc-100 px-3 text-sm font-bold text-zinc-950 outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0f3d2e]"
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

      <details className="rounded-[1rem] bg-zinc-50 ring-1 ring-black/5">
        <summary className="cursor-pointer px-3 py-3 text-[10px] font-black text-zinc-600">
          ¿Qué permite cada rol?
        </summary>

        <div className="space-y-3 border-t border-zinc-100 px-3 py-3 text-[10px] leading-4 text-zinc-500">
          <RoleDescription
            title="Jugador Fantasy"
            description="Ligas, Mi XI y puntos. No puede votar."
          />

          <RoleDescription
            title="Jugador equipo"
            description="Fantasy completo y votación de partidos."
          />

          <RoleDescription
            title="Entrenador"
            description="Puede votar. No participa en el Fantasy."
          />

          <RoleDescription
            title="Cuerpo técnico"
            description="Puede votar. No participa en el Fantasy."
          />

          <RoleDescription
            title="Directiva"
            description="Fantasy, votación, Match Admin y Administración completa."
          />
        </div>
      </details>

      <button
        type="submit"
        disabled={
          pending
        }
        className="flex min-h-11 w-full items-center justify-center rounded-[0.95rem] bg-[#0f3d2e] px-4 text-xs font-black text-white shadow-sm transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending
          ? "Guardando..."
          : "Guardar rol"}
      </button>

      {state.status !==
        "idle" && (
        <div
          role={
            state.status ===
            "error"
              ? "alert"
              : "status"
          }
          className={`rounded-[0.95rem] p-3 ${
            state.status ===
            "error"
              ? "bg-red-50"
              : "bg-[#e8f2ed]"
          }`}
        >
          <p
            className={`text-[10px] font-bold leading-4 ${
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
    </form>
  );
}

function RoleDescription({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="font-black text-zinc-700">
        {title}
      </p>

      <p className="mt-0.5">
        {description}
      </p>
    </div>
  );
}