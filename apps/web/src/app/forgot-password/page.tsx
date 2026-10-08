"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    const reason =
      new URLSearchParams(
        window.location.search,
      ).get("reason");

    if (
      reason ===
      "invalid-recovery-link"
    ) {
      setErrorMessage(
        "El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.",
      );
    }
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setMessage("");
    setErrorMessage("");

    const supabase =
      createBrowserSupabaseClient();

    try {
      await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            `${window.location.origin}/auth/callback`,
        },
      );
    } catch {
      /*
       * No diferenciamos entre cuentas existentes y no existentes.
       * El mensaje final evita filtrar información sobre usuarios.
       */
    }

    setPending(false);
    setMessage(
      "Si existe una cuenta con ese correo, recibirás un enlace para restablecer la contraseña.",
    );
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
                  Recuperar acceso
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-5 text-white/70">
              Te enviaremos un enlace seguro para crear una nueva contraseña.
            </p>
          </div>
        </header>

        <div className="flex-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <section className="relative z-10 -mt-2 rounded-[1.6rem] bg-white p-5 shadow-lg ring-1 ring-black/5">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
              Recuperación
            </p>

            <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
              ¿Has olvidado tu contraseña?
            </h2>

            <p className="mt-2 text-sm leading-6 text-zinc-500">
              Introduce el email de tu cuenta. Por seguridad, la respuesta será la misma exista o no ese usuario.
            </p>

            <form
              onSubmit={handleSubmit}
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
                    value={email}
                    onChange={(event) =>
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

              {errorMessage && (
                <div
                  role="alert"
                  className="rounded-[1.2rem] bg-amber-50 p-4"
                >
                  <p className="text-sm font-bold leading-5 text-amber-800">
                    {errorMessage}
                  </p>
                </div>
              )}

              {message && (
                <div
                  role="status"
                  className="rounded-[1.2rem] bg-[#e8f2ed] p-4"
                >
                  <p className="text-sm font-bold leading-5 text-[#0b2f23]">
                    {message}
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={pending}
                className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
              >
                {pending
                  ? "Enviando..."
                  : "Enviar enlace →"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <Link
                href="/login"
                className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-zinc-100 px-4 text-sm font-black text-zinc-950 transition active:scale-[0.99]"
              >
                Volver a iniciar sesión
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
