"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [sessionReady, setSessionReady] = useState<boolean | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let active = true;

    const supabase =
      createBrowserSupabaseClient();

    void supabase.auth
      .getSession()
      .then(({ data }) => {
        if (active) {
          setSessionReady(
            Boolean(
              data.session,
            ),
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setErrorMessage("");
    setSuccessMessage("");

    if (
      password.length < 8
    ) {
      setErrorMessage(
        "La nueva contraseña debe tener al menos 8 caracteres.",
      );
      return;
    }

    if (
      password !==
      confirmation
    ) {
      setErrorMessage(
        "Las contraseñas no coinciden.",
      );
      return;
    }

    setPending(true);

    const supabase =
      createBrowserSupabaseClient();

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      setPending(false);
      setErrorMessage(
        "No se pudo actualizar la contraseña. Solicita un nuevo enlace de recuperación.",
      );
      return;
    }

    await supabase.auth.signOut();

    setPassword("");
    setConfirmation("");
    setPending(false);
    setSuccessMessage(
      "Contraseña actualizada correctamente. Ya puedes iniciar sesión con la nueva contraseña.",
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
                  Nueva contraseña
                </h1>
              </div>
            </div>

            <p className="mt-4 max-w-sm text-sm leading-5 text-white/70">
              Elige una nueva contraseña para recuperar el acceso a tu cuenta.
            </p>
          </div>
        </header>

        <div className="flex-1 px-4 pb-[max(2rem,env(safe-area-inset-bottom))]">
          <section className="relative z-10 -mt-2 rounded-[1.6rem] bg-white p-5 shadow-lg ring-1 ring-black/5">
            {sessionReady === null && (
              <p className="text-sm font-semibold text-zinc-500">
                Validando enlace de recuperación...
              </p>
            )}

            {sessionReady === false && (
              <div className="space-y-4">
                <div
                  role="alert"
                  className="rounded-[1.2rem] bg-amber-50 p-4"
                >
                  <p className="text-sm font-bold leading-5 text-amber-800">
                    El enlace no es válido o ha caducado. Solicita uno nuevo.
                  </p>
                </div>

                <Link
                  href="/forgot-password"
                  className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white transition active:scale-[0.99]"
                >
                  Solicitar nuevo enlace
                </Link>
              </div>
            )}

            {sessionReady && (
              <>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                  Seguridad
                </p>

                <h2 className="mt-1 text-2xl font-black tracking-tight text-zinc-950">
                  Actualiza tu contraseña
                </h2>

                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  Usa al menos 8 caracteres y repite la contraseña para confirmarla.
                </p>

                {!successMessage && (
                  <form
                    onSubmit={handleSubmit}
                    className="mt-6 space-y-4"
                  >
                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        Nueva contraseña
                      </span>

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
                        className="mt-2 h-14 w-full rounded-[1rem] border-0 bg-zinc-100 px-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                      />
                    </label>

                    <label className="block">
                      <span className="text-xs font-black uppercase tracking-wide text-zinc-500">
                        Repetir contraseña
                      </span>

                      <input
                        type="password"
                        value={confirmation}
                        onChange={(event) =>
                          setConfirmation(
                            event.target.value,
                          )
                        }
                        required
                        minLength={8}
                        autoComplete="new-password"
                        placeholder="Repite la nueva contraseña"
                        className="mt-2 h-14 w-full rounded-[1rem] border-0 bg-zinc-100 px-4 text-base font-semibold text-zinc-950 outline-none ring-1 ring-transparent placeholder:font-normal placeholder:text-zinc-400 focus:bg-white focus:ring-[#0f3d2e]"
                      />
                    </label>

                    {errorMessage && (
                      <div
                        role="alert"
                        className="rounded-[1.2rem] bg-red-50 p-4"
                      >
                        <p className="text-sm font-bold leading-5 text-red-700">
                          {errorMessage}
                        </p>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={pending}
                      className="flex min-h-14 w-full items-center justify-center rounded-[1.2rem] bg-[#0f3d2e] px-4 text-base font-black text-white shadow-lg transition active:scale-[0.99] disabled:opacity-50"
                    >
                      {pending
                        ? "Actualizando..."
                        : "Guardar contraseña →"}
                    </button>
                  </form>
                )}

                {successMessage && (
                  <div className="mt-6 space-y-4">
                    <div
                      role="status"
                      className="rounded-[1.2rem] bg-[#e8f2ed] p-4"
                    >
                      <p className="text-sm font-bold leading-5 text-[#0b2f23]">
                        {successMessage}
                      </p>
                    </div>

                    <Link
                      href="/login"
                      className="flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white transition active:scale-[0.99]"
                    >
                      Ir a iniciar sesión
                    </Link>
                  </div>
                )}
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
