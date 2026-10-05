import Link from "next/link";

import {
  getProfiles,
} from "@/data/profiles";

import {
  formatRole,
} from "@/lib/roles";

import {
  updateUserVoterRoleAction,
} from "./actions";

import UserRoleForm from "./user-role-form";

export default async function AdminUsersPage() {
  const profiles =
    await getProfiles();

  const fantasyUsers =
    profiles.filter(
      (profile) =>
        profile.voter_role ===
        "jugador",
    ).length;

  const teamPlayers =
    profiles.filter(
      (profile) =>
        profile.voter_role ===
        "player",
    ).length;

  const voters =
    profiles.filter(
      (profile) =>
        profile.voter_role ===
          "player" ||
        profile.voter_role ===
          "entrenador" ||
        profile.voter_role ===
          "cuerpo_tecnico" ||
        profile.voter_role ===
          "directiva",
    ).length;

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/admin"
            className="text-[11px] font-bold text-white/65"
          >
            ← Administración
          </Link>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Accesos y permisos
          </p>

          <div className="mt-1 flex items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight">
                Usuarios
              </h1>

              <p className="mt-1 text-xs text-white/60">
                Gestiona roles y permisos
              </p>
            </div>

            <div className="rounded-[1rem] bg-white/10 px-3 py-2 text-center">
              <p className="text-2xl font-black">
                {profiles.length}
              </p>

              <p className="text-[7px] font-black uppercase tracking-wide text-white/45">
                usuarios
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-10">
        {/* RESUMEN */}
        <section className="mt-4 grid grid-cols-3 gap-2">
          <SummaryCard
            value={
              fantasyUsers
            }
            label="Fantasy"
          />

          <SummaryCard
            value={
              teamPlayers
            }
            label="Jugadores"
          />

          <SummaryCard
            value={
              voters
            }
            label="Con voto"
            highlight
          />
        </section>

        {/* INFORMACIÓN */}
        <section className="mt-3 rounded-[1.2rem] bg-[#e8f2ed] p-4">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Roles
          </p>

          <p className="mt-1 text-sm font-black text-[#0b2f23]">
            Control de acceso
          </p>

          <p className="mt-1 text-[10px] leading-4 text-[#557368]">
            Las cuentas nuevas se crean como Jugador Fantasy. Desde aquí
            puedes convertirlas en jugador de equipo, entrenador, cuerpo
            técnico o directiva.
          </p>
        </section>

        {/* USUARIOS */}
        <section className="mt-7">
          <div className="flex items-end justify-between px-1">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#0f3d2e]">
                Accesos
              </p>

              <h2 className="mt-0.5 text-xl font-black tracking-tight text-zinc-950">
                Usuarios registrados
              </h2>
            </div>

            <span className="text-[10px] font-bold text-zinc-400">
              {profiles.length}
            </span>
          </div>

          {profiles.length ===
          0 ? (
            <div className="mt-3 rounded-[1.3rem] bg-white p-5 text-center shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#e8f2ed] text-xl">
                👤
              </div>

              <p className="mt-3 font-black text-zinc-950">
                No hay usuarios disponibles
              </p>
            </div>
          ) : (
            <div className="mt-3 space-y-3">
              {profiles.map(
                (
                  profile,
                ) => {
                  const name =
                    profile.display_name ||
                    "Usuario";

                  const initial =
                    name
                      .charAt(
                        0,
                      )
                      .toUpperCase();

                  return (
                    <article
                      key={
                        profile.id
                      }
                      className="overflow-hidden rounded-[1.3rem] bg-white shadow-sm ring-1 ring-black/5"
                    >
                      <div className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#0f3d2e] text-sm font-black text-white">
                            {
                              initial
                            }
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-black text-zinc-950">
                              {
                                name
                              }
                            </p>

                            <p className="mt-0.5 truncate text-[9px] text-zinc-400">
                              {
                                profile.id
                              }
                            </p>
                          </div>

                          <RoleBadge
                            role={
                              profile.voter_role
                            }
                          />
                        </div>

                        <div className="mt-4 border-t border-zinc-100 pt-4">
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
                  );
                },
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function RoleBadge({
  role,
}: {
  role:
    | string
    | null;
}) {
  const label =
    formatRole(
      role,
    );

  const className =
    role ===
    "directiva"
      ? "bg-zinc-950 text-white"
      : role ===
          "jugador"
        ? "bg-[#e8f2ed] text-[#0f3d2e]"
        : role ===
              "player"
          ? "bg-blue-50 text-blue-700"
          : role ===
                "entrenador" ||
              role ===
                "cuerpo_tecnico"
            ? "bg-amber-50 text-amber-700"
            : "bg-zinc-100 text-zinc-500";

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[8px] font-black uppercase tracking-wide ${className}`}
    >
      {label}
    </span>
  );
}

function SummaryCard({
  value,
  label,
  highlight = false,
}: {
  value: number;
  label: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-[1.2rem] px-2 py-4 text-center shadow-sm ring-1 ${
        highlight
          ? "bg-[#e8f2ed] ring-[#d7e8df]"
          : "bg-white ring-black/5"
      }`}
    >
      <p
        className={`text-xl font-black ${
          highlight
            ? "text-[#0f3d2e]"
            : "text-zinc-950"
        }`}
      >
        {value}
      </p>

      <p className="mt-1 text-[7px] font-black uppercase tracking-wide text-zinc-400">
        {label}
      </p>
    </div>
  );
}