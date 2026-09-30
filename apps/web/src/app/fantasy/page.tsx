import Link from "next/link";

import { requireUser } from "@/lib/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/roles";

import LogoutButton from "./logout-button";

export default async function FantasyPage() {
  const user =
    await requireUser();

  const supabase =
    await createServerSupabaseClient();

  const {
    data: profile,
  } =
    await supabase
      .from("profiles")
      .select(
        "display_name, voter_role",
      )
      .eq(
        "id",
        user.id,
      )
      .maybeSingle();

  const displayName =
    profile?.display_name ??
    user.user_metadata
      ?.display_name ??
    user.email?.split(
      "@",
    )[0] ??
    "Jugador";

  const canAccessMatchAdmin =
    isAdminRole(
      profile?.voter_role,
    );

  return (
    <main className="mx-auto min-h-screen max-w-xl bg-zinc-50 px-4 py-8">
      <header>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
              Regional Fantasy
            </p>

            <h1 className="mt-2 text-3xl font-bold text-zinc-950">
              Hola, {displayName}
            </h1>

            {profile?.voter_role && (
              <p className="mt-1 text-xs font-medium text-zinc-400">
                {formatRole(
                  profile.voter_role,
                )}
              </p>
            )}
          </div>

          <LogoutButton />
        </div>

        <p className="mt-2 text-sm text-zinc-600">
          Gestiona tus ligas Fantasy y prepara tu equipo para la próxima jornada.
        </p>
      </header>

      {canAccessMatchAdmin && (
        <section className="mt-8">
          <Link
            href="/match-admin"
            className="flex min-h-24 items-center justify-between rounded-2xl bg-white px-5 py-4 shadow-sm ring-1 ring-zinc-200 transition hover:ring-zinc-400"
          >
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-zinc-400">
                Administración
              </p>

              <p className="mt-1 text-lg font-bold text-zinc-950">
                Match Admin
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                Convocatoria, estadísticas, votación y resultados
              </p>
            </div>

            <span className="ml-4 text-2xl font-bold text-zinc-400">
              →
            </span>
          </Link>
        </section>
      )}

      <section
        className={
          canAccessMatchAdmin
            ? "mt-4"
            : "mt-8"
        }
      >
        <Link
          href="/fantasy/leagues"
          className="flex min-h-24 items-center justify-between rounded-2xl bg-zinc-950 px-5 py-4 text-white shadow-sm"
        >
          <div>
            <p className="text-lg font-bold">
              Mis ligas
            </p>

            <p className="mt-1 text-sm text-zinc-300">
              Consulta tus ligas, clasificación y jornadas
            </p>
          </div>

          <span className="text-2xl">
            →
          </span>
        </Link>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-3">
        <Link
          href="/fantasy/leagues/create"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <span className="text-2xl font-black text-zinc-950">
            +
          </span>

          <p className="mt-5 font-bold text-zinc-950">
            Crear liga
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Crea una liga privada
          </p>
        </Link>

        <Link
          href="/fantasy/leagues/join"
          className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
        >
          <span className="text-2xl font-black text-zinc-950">
            #
          </span>

          <p className="mt-5 font-bold text-zinc-950">
            Unirme
          </p>

          <p className="mt-1 text-xs text-zinc-500">
            Entra mediante un código
          </p>
        </Link>
      </section>

      <section className="mt-8 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200">
        <p className="text-sm font-semibold text-zinc-950">
          Tu Fantasy
        </p>

        <p className="mt-2 text-sm leading-6 text-zinc-500">
          Elige tu XI para cada partido. Los puntos se calcularán a partir de las
          valoraciones finales de los jugadores.
        </p>
      </section>
    </main>
  );
}

function formatRole(
  role: string,
): string {
  switch (role) {
    case "entrenador":
      return "Entrenador";

    case "cuerpo_tecnico":
      return "Cuerpo técnico";

    case "directiva":
      return "Directiva";

    case "jugador":
      return "Jugador";

    default:
      return role;
  }
}