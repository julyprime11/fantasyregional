"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type TeamOption = {
  id: string;
  name: string;
};

export default function CreateLeagueForm({
  teams,
  userId,
}: {
  teams: TeamOption[];
  userId: string;
}) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState(
    teams[0]?.id ?? "",
  );
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setErrorMessage("");

    try {
      const response = await fetch(
        "/api/fantasy/leagues/create",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            code,
            teamId,
            userId,
          }),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message ??
            "No se pudo crear la liga.",
        );
        setPending(false);
        return;
      }

      router.push(
        `/fantasy/leagues/${result.id}`,
      );
      router.refresh();
    } catch {
      setErrorMessage(
        "No se pudo crear la liga. Inténtalo de nuevo.",
      );
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 space-y-4"
    >
      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Nombre de la liga
        </span>

        <input
          type="text"
          value={name}
          onChange={(event) =>
            setName(event.target.value)
          }
          required
          maxLength={80}
          placeholder="Liga del vestuario"
          className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Equipo real
        </span>

        <select
          value={teamId}
          onChange={(event) =>
            setTeamId(event.target.value)
          }
          required
          className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
        >
          {teams.map((team) => (
            <option
              key={team.id}
              value={team.id}
            >
              {team.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-sm font-medium text-zinc-700">
          Código de invitación
        </span>

        <input
          type="text"
          value={code}
          onChange={(event) =>
            setCode(
              event.target.value
                .toUpperCase()
                .replace(/\s/g, ""),
            )
          }
          required
          minLength={4}
          maxLength={12}
          placeholder="CASTELLO26"
          className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 uppercase outline-none focus:border-zinc-950"
        />

        <p className="mt-2 text-xs text-zinc-500">
          Este código lo compartirás con los demás participantes.
        </p>
      </label>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-3 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || teams.length === 0}
        className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-lg font-bold text-white disabled:opacity-50"
      >
        {pending
          ? "Creando liga..."
          : "Crear liga"}
      </button>
    </form>
  );
}