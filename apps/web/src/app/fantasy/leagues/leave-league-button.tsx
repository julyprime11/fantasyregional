"use client";

import { useActionState } from "react";

import {
  leaveFantasyLeagueAction,
  type LeaveLeagueState,
} from "@/app/fantasy/actions";

const initialState: LeaveLeagueState = {
  status: "idle",
  message: "",
};

export function LeaveLeagueButton({
  leagueId,
  leagueName,
}: {
  leagueId: string;
  leagueName: string;
}) {
  const [state, action, pending] = useActionState(
    leaveFantasyLeagueAction.bind(null, leagueId),
    initialState,
  );

  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `¿Quieres abandonar la liga "${leagueName}"?\n\nSe borrará tu participación y todas tus alineaciones Fantasy de esta liga. No se eliminarán la liga, los demás participantes ni tus votaciones de partidos.\n\nEsta acción no se puede deshacer.`,
        );
        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        disabled={pending}
        className="flex min-h-12 w-full items-center justify-center rounded-[1rem] border border-red-200 bg-red-50 px-4 text-sm font-black text-red-700 transition active:scale-[0.99] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
      >
        {pending ? "Abandonando liga..." : "Abandonar liga"}
      </button>

      {state.status === "error" && (
        <p role="alert" className="mt-3 rounded-xl bg-red-50 p-3 text-xs font-bold text-red-700">
          {state.message}
        </p>
      )}
    </form>
  );
}
