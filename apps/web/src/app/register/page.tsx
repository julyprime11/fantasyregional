"use client";

import Link from "next/link";
import { useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setMessage("");
    setErrorMessage("");

    const supabase =
      createBrowserSupabaseClient();

    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name:
              displayName.trim(),
          },
        },
      });

    if (error) {
      setPending(false);
      setErrorMessage(error.message);
      return;
    }

    if (!data.user) {
      setPending(false);
      setErrorMessage(
        "No se pudo crear el usuario.",
      );
      return;
    }

    setMessage(
      "Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.",
    );

    setPassword("");
    setPending(false);
  }

  const passwordValid =
    password.length >= 8;

  return (
    <main className="min-h-screen bg-[#f2f4f2]">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="relative overflow-hidden rounded-b-[2rem] bg-[#0f3d2e] px-5 pb-10 pt-8 text-white shadow-lg">
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full border-[30px] border-white/5" />

          <div className="absolute -bottom-20 -left-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

          <div className="relative z-10">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-2xl shadow-sm">
              ⚽
            </div>

            <p className="mt-6 text-[10px] font-black uppercase tracking-[0.22em] text-white/50">
              Fantasy Regional
            </p>

            <h1 className="mt-2 text-4xl font-black tracking-tight">
              Crear cuenta
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-white/70">
              Regístrate para crear ligas, preparar tu XI y competir con tus amigos.
            </p>
          </div>
        </header>

        <div className="flex-1 px-4 pb-8">
          <section className="relative z-10 -mt-2 rounded-[1.6rem] bg-white p-5 shadow-lg ring-1 ring-black/5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Registro
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                Crea tu perfil
              </h2>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Solo necesitas un nombre, email y contraseña.
              </p>
            </div>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >
              {/* NOMBRE */}
              <label className="block">
                <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
                  Nombre
                </span>

                <div className="relative mt-2">
                  <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
                    👤
                  </div>

                  <input
                    type="text"
                    value={displayName}
                    onChange={(event) =>
                      setDisplayName(
                        event.target.value,
                      )
                    }
                    required
                    maxLength={80}
                    autoComplete="name"
                    placeholder="Tu nombre"
                    className="h-14 w-full rounded-[1rem] border-0 bg-zinc-100 pl-11 pr-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                  />
                </div>
              </label>

              {/* EMAIL */}
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

              {/* CONTRASEÑA */}
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
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    required
                    minLength={8}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className="h-14 w-full rounded-[1rem] border-0 bg-zinc-100 pl-11 pr-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                  />
                </div>

                <div
                  className={`mt-3 flex items-center gap-3 rounded-xl px-3 py-3 ${
                    password
                      ? passwordValid
                        ? "bg-[#f0f6f3]"
                        : "bg-amber-50"
                      : "bg-zinc-50"
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                      password
                        ? passwordValid
                          ? "bg-[#0f3d2e] text-white"
                          : "bg-amber-500 text-white"
                        : "bg-zinc-200 text-zinc-400"
                    }`}
                  >
                    {password
                      ? passwordValid
                        ? "✓"
                        : "!"
                      : "8"}
                  </div>

                  <p
                    className={`text-xs font-semibold ${
                      password
                        ? passwordValid
                          ? "text-[#557368]"
                          : "text-amber-700"
                        : "text-zinc-400"
                    }`}
                  >
                    {password
                      ? passwordValid
                        ? "La contraseña cumple la longitud mínima."
                        : "Necesitas al menos 8 caracteres."
                      : "Usa al menos 8 caracteres."}
                  </p>
                </div>
              </label>

              {/* ERROR */}
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
                      {errorMessage}
                    </p>
                  </div>
                </div>
              )}

              {/* ÉXITO */}
              {message && (
                <div
                  role="status"
                  className="rounded-[1.2rem] bg-[#e8f2ed] p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-xs font-black text-white">
                      ✓
                    </div>

                    <div>
                      <p className="text-sm font-black text-[#0b2f23]">
                        Cuenta creada
                      </p>

                      <p className="mt-1 text-xs leading-5 text-[#557368]">
                        {message}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* BOTÓN */}
              <button
                type="submit"
                disabled={pending}
                className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
              >
                {pending
                  ? "Creando cuenta..."
                  : "Crear cuenta →"}
              </button>
            </form>

            <div className="mt-6 border-t border-zinc-100 pt-5">
              <p className="text-center text-sm text-zinc-500">
                ¿Ya tienes cuenta?
              </p>

              <Link
                href="/login"
                className="mt-3 flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-zinc-100 px-4 text-sm font-black text-zinc-950 transition active:scale-[0.99]"
              >
                Iniciar sesión
              </Link>
            </div>
          </section>

          <section className="mt-5 rounded-[1.4rem] bg-[#e8f2ed] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-sm font-black text-white">
                ⚽
              </div>

              <div>
                <p className="font-black text-[#0b2f23]">
                  Empieza tu temporada
                </p>

                <p className="mt-1 text-xs leading-5 text-[#557368]">
                  Crea una liga o únete con un código y prepara tu primer XI.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}