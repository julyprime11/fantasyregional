"use client";

import { useActionState } from "react";
import type { VoteState } from "./actions";

export type VotingPlayer = {
  id: string; name: string; shirtNumber: number | null; position: string; team: string;
};

export function VoteForm({ action, players }: {
  action: (state: VoteState, form: FormData) => Promise<VoteState>;
  players: VotingPlayer[];
}) {
  const [state, formAction, pending] = useActionState(action, { status: "idle", message: "" });
  return <form action={formAction} className="mt-6 space-y-6">
    <fieldset disabled={pending} className="space-y-4">
      <legend className="font-semibold">Identidad temporal de desarrollo</legend>
      <p>Este UUID y rol se introducen manualmente y no verifican tu identidad. Usa el mismo UUID durante las pruebas.</p>
      <label className="block">UUID del votante
        <input name="voter_id" required maxLength={36} defaultValue={state.values?.voter_id ?? ""} className="mt-1 block w-full rounded border p-2" />
      </label>
      <label className="block">Rol del votante (desarrollo)
        <input name="voter_role" required maxLength={500} defaultValue={state.values?.voter_role ?? ""} className="mt-1 block w-full rounded border p-2" />
      </label>
      <p>Puntúa de 1 a 10. Deja en blanco los jugadores que no quieras votar o que ya hayas votado.</p>
      {players.map(player => <section key={player.id} className="border-t pt-4">
        <h2 className="font-semibold">{player.name}</h2>
        <p>{player.team} · {player.position} · Dorsal: {player.shirtNumber ?? "Sin dorsal"}</p>
        <label className="block">Puntuación para {player.name}
          <input name={`score:${player.id}`} type="number" min={1} max={10} step="any"
            defaultValue={state.values?.[`score:${player.id}`] ?? ""} className="ml-2 w-24 rounded border p-2" />
        </label>
      </section>)}
      <button type="submit" className="rounded border px-4 py-2 disabled:opacity-50" disabled={players.length === 0}>
        {pending ? "Enviando…" : "Enviar votos"}
      </button>
    </fieldset>
    {state.message && <p role={state.status === "error" ? "alert" : "status"}>{state.message}</p>}
  </form>;
}
