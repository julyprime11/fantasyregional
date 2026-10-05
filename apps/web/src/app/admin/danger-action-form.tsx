"use client";

import {
  useActionState,
} from "react";

import type {
  FormState,
} from "./actions";

type Props = {
  action: (
    state: FormState,
    form: FormData,
  ) => Promise<FormState>;

  label: string;

  confirmation: string;
};

const initialState: FormState = {
  status:
    "idle",

  message:
    "",
};

export function DangerActionForm({
  action,
  label,
  confirmation,
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
      onSubmit={(
        event,
      ) => {
        if (
          !window.confirm(
            confirmation,
          )
        ) {
          event.preventDefault();
        }
      }}
      className="space-y-2"
    >
      <button
        type="submit"
        disabled={
          pending
        }
        className="flex min-h-11 w-full items-center justify-center rounded-[0.95rem] bg-red-50 px-4 text-xs font-black text-red-700 ring-1 ring-red-100 transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending
          ? "Eliminando..."
          : label}
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
          className={`rounded-[0.9rem] p-3 ${
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