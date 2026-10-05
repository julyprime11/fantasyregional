"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState("");

  const [
    pending,
    setPending,
  ] =
    useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setErrorMessage("");

    const supabase =
      createBrowserSupabaseClient();

    const { error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) {
      setPending(false);

      if (
        error.message
          .toLowerCase()
          .includes(
            "email not confirmed",
          )
      ) {
        setErrorMessage(
          "Debes confirmar tu correo electrónico antes de iniciar sesión.",
        );

        return;
      }

      setErrorMessage(
        "No se pudo iniciar sesión. Revisa el email y la contraseña.",
      );

      return;
    }

 router.push(
  "/post-login",
);
    router.refresh();
  }

  return (
    <main className="app-screen bg-[#f2f4f2]">
      <div className="mx-auto flex min-h-[100dvh] max-w-md flex-col">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-8 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

          <div className="relative z-10">
            <div className="flex items-center gap-4">
              <Image
                src="/icon-192.png"
                alt="Fantasy Regional"
                width={72}
                height={72}
                priority
                className="h-[72px] w-[72px] rounded-[1.35rem] shadow-lg ring-1 ring-white/15"
              />

              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/55">
                  Fantasy Regional
                </p>

                <h1 className="mt-1 text-3xl font-black tracking-tight">
                  Bienvenido
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-5 text-white/70">
              Accede a tus ligas, prepara tu XI y sigue cada jornada.
            </p>
          </div>
        </header>

        <div className="flex-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <section className="relative z-10 -mt-2 rounded-[1.6rem] bg-white p-5 shadow-lg ring-1 ring-black/5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Acceso
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Iniciar sesión
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Introduce tus datos para entrar en Fantasy Regional.
              </p>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-6 space-y-4"
            >
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
                  Email
                </span>

                <div className="relative mt-2">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    @
                  </div>

                  <input
                    type="email"
                    value={
                      email
                    }
                    onChange={(
                      event,
                    ) =>
                      setEmail(
                        event.target.value,
                      )
                    }
                    required
                    autoComplete="email"
                    placeholder="tu@email.com"
                    className="h-14 w-full rounded-[1rem] border-0 bg-zinc-100 pl-11 pr-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                  />
                </div>
              </label>

              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
                  Contraseña
                </span>

                <div className="relative mt-2">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                    ●
                  </div>

                  <input
                    type="password"
                    value={
                      password
                    }
                    onChange={(
                      event,
                    ) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    required
                    autoComplete="current-password"
                    placeholder="Tu contraseña"
                    className="h-14 w-full rounded-[1rem] border-0 bg-zinc-100 pl-11 pr-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                  />
                </div>
              </label>

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-[1.2rem] bg-red-50 p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-600 text-xs font-black text-white">
                      !
                    </div>

                    <p className="pt-1 text-sm font-bold leading-5 text-red-700">
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
                  pending
                }
                className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
              >
                {pending
                  ? "Entrando..."
                  : "Entrar a Fantasy →"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <p className="text-center text-sm text-zinc-500">
                ¿Todavía no tienes cuenta?
              </p>

              <Link
                href="/register"
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-zinc-100 px-4 text-sm font-black text-zinc-950 transition active:scale-[0.99]"
              >
                Crear una cuenta
              </Link>
            </div>
          </section>

          <section className="mt-5 rounded-[1.4rem] bg-[#e8f2ed] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-sm font-black text-white">
                11
              </div>

              <div>
                <p className="font-black text-[#0b2f23]">
                  Tu fútbol, tu Fantasy
                </p>

                <p className="mt-1 text-xs leading-5 text-[#557368]">
                  Compite con tus amigos y suma puntos con el rendimiento real de los jugadores.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
