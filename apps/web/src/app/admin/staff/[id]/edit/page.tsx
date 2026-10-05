import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  parseStaffId,
} from "@regional-fantasy/shared";

import {
  getStaffById,
} from "@/data/staff";

import {
  getTeams,
} from "@/data/teams";

import {
  updateStaffAction,
} from "../../../actions";

import {
  CreateForm,
} from "../../../create-form";

import {
  staffFields,
} from "../../fields";

export default async function EditStaffPage({
  params,
}: {
  params: Promise<{
    id: string;
  }>;
}) {
  const {
    id,
  } =
    await params;

  let staffId: string;

  try {
    staffId =
      parseStaffId(
        id,
      );
  } catch {
    notFound();
  }

  let loaded;

  try {
    loaded =
      await Promise.all([
        getStaffById(
          staffId,
        ),

        getTeams(),
      ]);
  } catch {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No se pudo cargar el miembro del cuerpo técnico.
          </p>

          <p className="mt-2 text-sm text-red-600">
            Inténtalo de nuevo.
          </p>

          <Link
            href="/admin/staff"
            className="mt-4 inline-flex text-sm font-black text-red-700 underline"
          >
            ← Volver al cuerpo técnico
          </Link>
        </section>
      </main>
    );
  }

  const [
    member,
    teams,
  ] =
    loaded;

  if (!member) {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-black text-zinc-950">
            Miembro no encontrado
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            El miembro del cuerpo técnico ya no está disponible.
          </p>

          <Link
            href="/admin/staff"
            className="mt-4 inline-flex text-sm font-black text-[#0f3d2e] underline"
          >
            ← Volver al cuerpo técnico
          </Link>
        </section>
      </main>
    );
  }

  const fullName =
    `${member.first_name} ${
      member.last_name ??
      ""
    }`.trim();

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/admin/staff"
            className="text-[11px] font-bold text-white/65"
          >
            ← Cuerpo técnico
          </Link>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Editar miembro
          </p>

          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-black">
              {member.first_name
                .charAt(
                  0,
                )
                .toUpperCase()}
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black tracking-tight">
                {
                  fullName
                }
              </h1>

              <p className="mt-1 text-xs text-white/60">
                {
                  member.role
                }
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 pb-10">
        <section className="mt-4 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-5">
            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
              Datos del miembro
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Modifica su equipo, nombre, cargo, imagen o estado.
            </p>
          </div>

          {teams.length ===
            0 && (
            <div className="mb-4 rounded-[1rem] bg-amber-50 p-3">
              <p className="text-xs font-bold text-amber-800">
                No hay equipos disponibles. Crea un equipo antes de guardar.
              </p>
            </div>
          )}

          <CreateForm
            key={
              member.id
            }
            action={updateStaffAction.bind(
              null,
              member.id,
            )}
            fields={
              staffFields(
                teams,
              )
            }
            disabled={
              teams.length ===
              0
            }
            submitLabel="Guardar cambios"
            initialValues={{
              team_id:
                member.team_id,

              first_name:
                member.first_name,

              last_name:
                member.last_name ??
                "",

              role:
                member.role,

              image_url:
                member.image_url ??
                "",

              active:
                member.active
                  ? "on"
                  : "",
            }}
          />
        </section>

        <Link
          href="/admin/staff"
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-[1rem] bg-zinc-100 px-4 text-xs font-black text-zinc-600 transition active:scale-[0.99]"
        >
          Cancelar y volver
        </Link>
      </div>
    </main>
  );
}