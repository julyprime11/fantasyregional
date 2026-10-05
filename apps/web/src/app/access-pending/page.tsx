import Link from "next/link";

import {
  requireUser,
} from "@/lib/auth";

import {
  createServerSupabaseClient,
} from "@/lib/supabase/server";

export default async function AccessPendingPage() {
  const user =
    await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
  } =
    await supabase
      .from(
        "profiles",
      )
      .select(
        "display_name, voter_role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-5 pb-7 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full border-[28px] border-white/5" />

        <div className="absolute -bottom-20 -left-16 h-40 w-40 rounded-full border-[26px] border-white/5" />

        <div className="relative z-10">
          <p className="text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
            Fantasy Regional
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Cuenta registrada
          </h1>

          <p className="mt-2 text-sm leading-5 text-white/65">
            Tu cuenta todavía no tiene un rol asignado.
          </p>
        </div>
      </header>

      <div className="px-4 pb-10">
        <section className="mt-5 rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#e8f2ed] text-xl">
              ✓
            </div>

            <div>
              <p className="font-black text-zinc-950">
                Hola,{" "}
                {
                  profile?.display_name ??
                  "usuario"
                }
              </p>

              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Tu acceso está creado correctamente, pero la Directiva debe
                asignarte un tipo de usuario antes de que puedas entrar en la
                aplicación.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Roles disponibles
          </p>

          <div className="mt-3 space-y-2 text-xs leading-5 text-[#0b2f23]">
            <p>
              <strong>Jugador Fantasy</strong> · ligas, XI y puntos.
            </p>

            <p>
              <strong>Jugador equipo</strong> · Fantasy + votaciones.
            </p>

            <p>
              <strong>Entrenador</strong> · votaciones.
            </p>

            <p>
              <strong>Cuerpo técnico</strong> · votaciones.
            </p>

            <p>
              <strong>Directiva</strong> · acceso completo.
            </p>
          </div>
        </section>

        <Link
          href="/post-login"
          className="mt-5 flex min-h-12 w-full items-center justify-center rounded-[1rem] bg-[#0f3d2e] px-4 text-sm font-black text-white shadow-lg transition active:scale-[0.99]"
        >
          Comprobar acceso de nuevo
        </Link>
      </div>
    </main>
  );
}