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

    const supabase = createBrowserSupabaseClient();

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName.trim(),
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

    /*
     * De momento guardamos display_name también
     * como metadata del usuario.
     *
     * La fila en public.profiles la crearemos de
     * forma segura en el servidor en el siguiente paso.
     */

    setMessage(
      "Cuenta creada. Revisa tu correo para confirmar la dirección antes de iniciar sesión.",
    );

    setPassword("");
    setPending(false);
  }

  return (
    <main className="mx-auto min-h-screen max-w-md bg-zinc-50 px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          Regional Fantasy
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Crear cuenta
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Regístrate para crear o unirte a una liga Fantasy.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 space-y-4"
        >
          <label className="block">
            <span className="text-sm font-medium text-zinc-700">
              Nombre
            </span>

            <input
              type="text"
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              required
              maxLength={80}
              autoComplete="name"
              className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-3 outline-none focus:border-zinc-950"
            />
          </label>

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
              minLength={8}
              autoComplete="new-password"
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

          {message && (
            <p
              role="status"
              className="rounded-xl bg-green-50 p-3 text-sm text-green-700"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="flex min-h-14 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-lg font-bold text-white disabled:opacity-50"
          >
            {pending
              ? "Creando cuenta..."
              : "Crear cuenta"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-600">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-semibold text-zinc-950 underline"
          >
            Iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}