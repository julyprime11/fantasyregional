"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function JoinLeagueForm() {
  const router = useRouter();

  const [code, setCode] =
    useState("");

  const [pending, setPending] =
    useState(false);

  const [errorMessage, setErrorMessage] =
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
          "/api/fantasy/leagues/join",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              code,
            }),
          },
        );

      const result =
        await response.json();

      if (!response.ok) {
        setErrorMessage(
          result.message ??
            "No se pudo entrar en la liga.",
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
        "No se pudo entrar en la liga. Inténtalo de nuevo.",
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
          Código de la liga
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
          autoComplete="off"
          placeholder="CASTELLO26"
          className="mt-2 h-14 w-full rounded-xl border border-zinc-300 bg-white px-4 text-center text-xl font-black uppercase tracking-widest outline-none focus:border-zinc-950"
        />

        <p className="mt-2 text-sm text-zinc-500">
          Introduce el código que te haya enviado el creador de la liga.
        </p>
      </label>

      {errorMessage && (
        <p
          role="alert"
          className="rounded-xl bg-red-50 p-4 text-sm text-red-700"
        >
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          code.trim().length < 4
        }
        className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-lg font-bold text-white disabled:opacity-40"
      >
        {pending
          ? "Entrando..."
          : "Unirme a la liga"}
      </button>
    </form>
  );
}