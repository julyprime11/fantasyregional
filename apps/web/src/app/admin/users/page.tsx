import Link from "next/link";

import {
  getProfiles,
} from "@/data/profiles";

import {
  updateUserVoterRoleAction,
} from "./actions";

import UserRoleForm from "./user-role-form";

export default async function AdminUsersPage() {
  const profiles =
    await getProfiles();

  return (
    <main className="mx-auto min-h-screen max-w-3xl bg-zinc-50 px-4 py-8">
      <header>
        <Link
          href="/admin"
          className="text-sm font-medium text-zinc-600 underline"
        >
          ← Volver al admin
        </Link>

        <p className="mt-5 text-sm font-medium uppercase tracking-wide text-zinc-500">
          Administración
        </p>

        <h1 className="mt-1 text-3xl font-bold text-zinc-950">
          Usuarios
        </h1>

        <p className="mt-2 text-sm text-zinc-600">
          Gestiona el rol de votación de cada usuario.
        </p>
      </header>

      {profiles.length === 0 ? (
        <section className="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-zinc-200">
          <p className="font-semibold text-zinc-950">
            No hay usuarios disponibles.
          </p>
        </section>
      ) : (
        <section className="mt-6 space-y-4">
          {profiles.map(
            (profile) => (
              <article
                key={profile.id}
                className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-zinc-200"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="text-lg font-bold text-zinc-950">
                      {
                        profile.display_name
                      }
                    </h2>

                    <p className="mt-1 break-all text-xs text-zinc-400">
                      {profile.id}
                    </p>

                    <div className="mt-3">
                      <span className="text-xs font-medium uppercase tracking-wide text-zinc-400">
                        Rol actual
                      </span>

                      <p className="mt-1 font-semibold text-zinc-700">
                        {profile.voter_role
                          ? formatRole(
                              profile.voter_role,
                            )
                          : "Sin rol"}
                      </p>
                    </div>
                  </div>

                  <div className="w-full sm:max-w-xs">
                    <UserRoleForm
                      action={updateUserVoterRoleAction.bind(
                        null,
                        profile.id,
                      )}
                      currentRole={
                        profile.voter_role
                      }
                    />
                  </div>
                </div>
              </article>
            ),
          )}
        </section>
      )}
    </main>
  );
}

function formatRole(
  role: string,
): string {
  switch (role) {
    case "jugador":
      return "Jugador";

    case "entrenador":
      return "Entrenador";

    case "cuerpo_tecnico":
      return "Cuerpo técnico";

    case "directiva":
      return "Directiva";

    default:
      return role;
  }
}