"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setPending(true);
    setErrorMessage("");

    const supabase = createBrowserSupabaseClient();

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
          .includes("email not confirmed")
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

    router.push("/fantasy");
    router.refresh();
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-zinc-50 px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Iniciar sesión
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Accede a tus ligas y alineaciones.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Email
            </span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              autoComplete="email"
              className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Contraseña
            </span>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              autoComplete="current-password"
              className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
            />
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
            disabled={pending}
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {pending
              ? "Entrando..."
              : "Iniciar sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-semibold text-zinc-950 underline"
          >
            Crear cuenta
          </Link>
        </p>
      </div>
    </main>
  );
}