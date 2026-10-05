import Link from "next/link";

import {
  notFound,
} from "next/navigation";

import {
  parsePlayerId,
} from "@regional-fantasy/shared";

import {
  getPlayerById,
} from "@/data/players";

import {
  getTeams,
} from "@/data/teams";

import {
  deletePlayerAction,
  updatePlayerAction,
} from "../../../actions";

import {
  DangerActionForm,
} from "../../../danger-action-form";

import {
  CreateForm,
} from "../../../create-form";

import {
  playerFields,
} from "../../fields";

export default async function EditPlayerPage({
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

  try {
    parsePlayerId(
      id,
    );
  } catch {
    notFound();
  }

  let loaded;

  try {
    loaded =
      await Promise.all([
        getPlayerById(
          id,
        ),

        getTeams(),
      ]);
  } catch {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-red-50 p-5">
          <p className="font-black text-red-700">
            No se pudo cargar el jugador.
          </p>

          <Link
            href="/admin/players"
            className="mt-4 inline-flex text-sm font-black text-red-700 underline"
          >
            ← Volver a jugadores
          </Link>
        </section>
      </main>
    );
  }

  const [
    player,
    teams,
  ] =
    loaded;

  if (!player) {
    return (
      <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2] px-4 py-8">
        <section className="rounded-[1.4rem] bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p className="font-black text-zinc-950">
            Jugador no encontrado
          </p>

          <p className="mt-2 text-sm text-zinc-500">
            El jugador ya no está disponible.
          </p>

          <Link
            href="/admin/players"
            className="mt-4 inline-flex text-sm font-black text-[#0f3d2e] underline"
          >
            ← Volver a jugadores
          </Link>
        </section>
      </main>
    );
  }

  const fullName =
    `${player.first_name} ${
      player.last_name ??
      ""
    }`.trim();

  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/admin/players"
            className="text-[11px] font-bold text-white/65"
          >
            ← Jugadores
          </Link>

          <p className="mt-4 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Editar jugador
          </p>

          <div className="mt-1 flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-lg font-black">
              {
                player.shirt_number ??
                "—"
              }
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-2xl font-black tracking-tight">
                {
                  fullName
                }
              </h1>

              <p className="mt-1 text-xs text-white/60">
                {
                  player.position
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
              Datos del jugador
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Modifica la información y guarda los cambios.
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
              player.id
            }
            action={updatePlayerAction.bind(
              null,
              player.id,
            )}
            fields={
              playerFields(
                teams,
              )
            }
            disabled={
              teams.length ===
              0
            }
            submitLabel="Guardar cambios"
            initialValues={{
              first_name:
                player.first_name,

              last_name:
                player.last_name ??
                "",

              shirt_number:
                player.shirt_number ===
                null
                  ? ""
                  : String(
                      player.shirt_number,
                    ),

              position:
                player.position,

              image_url:
                player.image_url ??
                "",

              active:
                player.active
                  ? "on"
                  : "",

              team_id:
                player.team_id,
            }}
          />
        </section>

        <section className="mt-4 overflow-hidden rounded-[1.4rem] bg-white shadow-sm ring-1 ring-red-100">
          <div className="p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-lg">
                ⚠
              </div>

              <div className="min-w-0">
                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-red-500">
                  Zona peligrosa
                </p>

                <h2 className="mt-1 text-base font-black text-zinc-950">
                  Eliminar jugador
                </h2>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Si el jugador todavía no tiene histórico, se eliminará
                  definitivamente.
                </p>

                <p className="mt-1 text-xs leading-5 text-zinc-500">
                  Si ya aparece en partidos, votaciones o alineaciones Fantasy,
                  no perderemos esos datos: el jugador quedará desactivado.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <DangerActionForm
                action={deletePlayerAction.bind(
                  null,
                  player.id,
                )}
                label="Eliminar jugador"
                confirmation={`¿Seguro que quieres eliminar a "${fullName}"? Si no tiene histórico, esta acción será definitiva.`}
              />
            </div>
          </div>
        </section>

        <Link
          href="/admin/players"
          className="mt-4 flex min-h-11 w-full items-center justify-center rounded-[1rem] bg-zinc-100 px-4 text-xs font-black text-zinc-600 transition active:scale-[0.99]"
        >
          Cancelar y volver
        </Link>
      </div>
    </main>
  );
}