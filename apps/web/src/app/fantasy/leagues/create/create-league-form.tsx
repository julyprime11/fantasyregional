"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

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
  const router =
    useRouter();

  const [
    name,
    setName,
  ] =
    useState("");

  const [
    teamId,
    setTeamId,
  ] =
    useState(
      teams[0]?.id ??
        "",
    );

  const [
    code,
    setCode,
  ] =
    useState("");

  const [
    pending,
    setPending,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setErrorMessage("");

    try {
      const response =
        await fetch(
          "/api/fantasy/leagues/create",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                name,
                code,
                teamId,
                userId,
              }),
          },
        );

      const result =
        await response.json();

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
      onSubmit={
        handleSubmit
      }
      className="mt-5 space-y-4"
    >
      {/* NOMBRE */}
      <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
            1
          </div>

          <div className="flex-1">
            <p className="font-black text-zinc-950">
              Nombre de la liga
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              El nombre que verán todos los participantes.
            </p>
          </div>
        </div>

        <input
          type="text"
          value={
            name
          }
          onChange={(
            event,
          ) =>
            setName(
              event.target.value,
            )
          }
          required
          maxLength={80}
          placeholder="Ej. Liga del vestuario"
          className="mt-4 h-14 w-full rounded-[1rem] border-0 bg-zinc-100 px-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
        />
      </section>

      {/* EQUIPO */}
      <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
            2
          </div>

          <div className="flex-1">
            <p className="font-black text-zinc-950">
              Equipo real
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Los jugadores disponibles en la liga pertenecerán a este equipo.
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <select
            value={
              teamId
            }
            onChange={(
              event,
            ) =>
              setTeamId(
                event.target.value,
              )
            }
            required
            className="h-14 w-full appearance-none rounded-[1rem] border-0 bg-zinc-100 px-4 pr-12 text-base font-bold text-zinc-950 outline-none ring-1 ring-transparent focus:bg-white focus:ring-[#0f3d2e]"
          >
            {teams.map(
              (team) => (
                <option
                  key={
                    team.id
                  }
                  value={
                    team.id
                  }
                >
                  {
                    team.name
                  }
                </option>
              ),
            )}
          </select>

          <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-zinc-400">
            ↓
          </span>
        </div>
      </section>

      {/* CÓDIGO */}
      <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
            3
          </div>

          <div className="flex-1">
            <p className="font-black text-zinc-950">
              Código de invitación
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Tus amigos utilizarán este código para entrar en la liga.
            </p>
          </div>
        </div>

        <div className="relative mt-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-black text-[#0f3d2e]">
            #
          </span>

          <input
            type="text"
            value={
              code
            }
            onChange={(
              event,
            ) =>
              setCode(
                event.target.value
                  .toUpperCase()
                  .replace(
                    /\s/g,
                    "",
                  ),
              )
            }
            required
            minLength={4}
            maxLength={12}
            placeholder="CASTELLO26"
            className="h-14 w-full rounded-[1rem] border-0 bg-zinc-100 pl-10 pr-4 font-black uppercase tracking-[0.12em] text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-semibold placeholder:tracking-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
          />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl bg-[#f0f6f3] px-3 py-3">
          <span className="text-sm">
            ✓
          </span>

          <p className="text-xs leading-5 text-[#557368]">
            Usa un código fácil de recordar. Después podrás compartirlo directamente desde la liga.
          </p>
        </div>
      </section>

      {/* ERROR */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-[1.3rem] bg-red-50 p-4"
        >
          <p className="text-sm font-bold text-red-700">
            {
              errorMessage
            }
          </p>
        </div>
      )}

      {/* RESUMEN */}
      <section className="rounded-[1.4rem] bg-[#e8f2ed] p-4">
        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
          Nueva liga
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-black text-[#0b2f23]">
              {name.trim() ||
                "Nombre de tu liga"}
            </p>

            <p className="mt-1 truncate text-xs font-semibold text-[#557368]">
              {teams.find(
                (team) =>
                  team.id ===
                  teamId,
              )?.name ??
                "Equipo"}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <p className="text-[9px] font-black uppercase tracking-wide text-[#557368]">
              Código
            </p>

            <p className="mt-1 font-black tracking-wider text-[#0f3d2e]">
              {code ||
                "—"}
            </p>
          </div>
        </div>
      </section>

      {/* CREAR */}
      <button
        type="submit"
        disabled={
          pending ||
          teams.length ===
            0
        }
        className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-40"
      >
        {pending
          ? "Creando liga..."
          : "Crear liga →"}
      </button>
    </form>
  );
}