"use client";

import {
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

export default function JoinLeagueForm({
  initialCode = "",
}: {
  initialCode?: string;
}) {
  const router =
    useRouter();

  const [
    code,
    setCode,
  ] =
    useState(
      initialCode,
    );

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
          "/api/fantasy/leagues/join",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
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
        `/fantasy?league=${encodeURIComponent(
          result.id,
        )}`,
      );

      router.refresh();
    } catch {
      setErrorMessage(
        "No se pudo entrar en la liga. Inténtalo de nuevo.",
      );

      setPending(false);
    }
  }

  const validCode =
    code.trim().length >=
    4;

  return (
    <form
      onSubmit={
        handleSubmit
      }
      className="mt-5 space-y-4"
    >
      <section className="rounded-[1.5rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#e8f2ed] text-lg font-black text-[#0f3d2e]">
            #
          </div>

          <div className="flex-1">
            <p className="font-black text-zinc-950">
              Código de la liga
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Introduce el código que te haya enviado el creador.
            </p>
          </div>
        </div>

        <div className="relative mt-5">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xl font-black text-[#0f3d2e]">
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
            minLength={
              4
            }
            maxLength={
              12
            }
            autoComplete="off"
            autoCapitalize="characters"
            placeholder="CASTELLO26"
            className="h-16 w-full rounded-[1rem] border-0 bg-zinc-100 pl-11 pr-4 text-center text-xl font-black uppercase tracking-[0.14em] text-zinc-950 outline-none ring-1 ring-transparent placeholder:text-zinc-300 focus:bg-white focus:ring-[#0f3d2e]"
          />
        </div>

        <div
          className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-3 ${
            validCode
              ? "bg-[#f0f6f3]"
              : "bg-zinc-50"
          }`}
        >
          <div
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
              validCode
                ? "bg-[#0f3d2e] text-white"
                : "bg-zinc-200 text-zinc-400"
            }`}
          >
            {validCode
              ? "✓"
              : "!"}
          </div>

          <p
            className={`text-xs font-semibold ${
              validCode
                ? "text-[#557368]"
                : "text-zinc-400"
            }`}
          >
            {validCode
              ? "Código listo para intentar entrar."
              : "El código debe tener al menos 4 caracteres."}
          </p>
        </div>
      </section>

      {code && (
        <section className="rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Código introducido
          </p>

          <div className="mt-2 flex items-center justify-between gap-4">
            <p className="truncate text-xl font-black tracking-[0.14em] text-[#0b2f23]">
              {code}
            </p>

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-sm font-black text-white">
              #
            </div>
          </div>
        </section>
      )}

      {errorMessage && (
        <div
          role="alert"
          className="rounded-[1.3rem] bg-red-50 p-4"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
              !
            </div>

            <p className="pt-1 text-sm font-bold text-red-700">
              {
                errorMessage
              }
            </p>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={
          pending ||
          !validCode
        }
        className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-40"
      >
        {pending
          ? "Entrando..."
          : "Unirme a la liga →"}
      </button>

      <p className="px-4 text-center text-[11px] leading-5 text-zinc-400">
        Al entrar pasarás a formar parte de la clasificación de esa liga.
      </p>
    </form>
  );
}