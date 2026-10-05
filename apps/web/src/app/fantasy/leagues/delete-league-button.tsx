"use client";

import {
  useActionState,
} from "react";

import {
  deleteFantasyLeagueAction,
  type DeleteLeagueState,
} from "../actions";

const initialState: DeleteLeagueState = {
  status:
    "idle",

  message:
    "",
};

export function DeleteLeagueButton({
  leagueId,
  leagueName,
}: {
  leagueId: string;
  leagueName: string;
}) {
  const [
    state,
    action,
    pending,
  ] =
    useActionState(
      deleteFantasyLeagueAction.bind(
        null,
        leagueId,
      ),
      initialState,
    );

  return (
    <form
      action={action}
      onSubmit={(
        event,
      ) => {
        const confirmed =
          window.confirm(
            `¿Seguro que quieres eliminar la liga "${leagueName}"? Se eliminarán sus miembros y alineaciones Fantasy. Esta acción no se puede deshacer.`,
          );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={
          pending
        }
        className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-red-50 px-4 text-sm font-black text-red-700 ring-1 ring-red-100 transition active:scale-[0.99] disabled:opacity-50"
      >
        {pending
          ? "Eliminando liga..."
          : "Eliminar liga"}
      </button>

      {state.status ===
        "error" && (
        <p className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
          {
            state.message
          }
        </p>
      )}
    </form>
  );
}