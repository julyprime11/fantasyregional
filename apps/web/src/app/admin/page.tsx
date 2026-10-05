import Link from "next/link";

const adminItems = [
  {
    href: "/admin/clubs",
    icon: "🏟️",
    title: "Clubs",
    description:
      "Crear y gestionar clubs.",
  },
  {
    href: "/admin/teams",
    icon: "🛡️",
    title: "Equipos",
    description:
      "Crear equipos y asignarlos a sus clubs.",
  },
  {
    href: "/admin/players",
    icon: "👤",
    title: "Jugadores",
    description:
      "Gestionar jugadores, dorsales y posiciones.",
  },
  {
    href: "/admin/staff",
    icon: "👥",
    title: "Cuerpo técnico",
    description:
      "Gestionar entrenadores y miembros del staff.",
  },
  {
    href: "/admin/matches",
    icon: "⚽",
    title: "Partidos",
    description:
      "Crear y editar partidos y jornadas.",
  },
  {
    href: "/admin/users",
    icon: "🔐",
    title: "Usuarios y roles",
    description:
      "Asignar permisos y tipos de usuario.",
  },
  {
    href: "/admin/ffcv-sync",
    icon: "↻",
    title: "Sincronización FFCV",
    description:
      "Importar y actualizar jugadores desde FFCV.",
  },
];

export default function AdminPage() {
  return (
    <main className="app-screen mx-auto min-h-screen max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-5 pt-[calc(env(safe-area-inset-top)+1rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="absolute -bottom-16 -left-14 h-36 w-36 rounded-full border-[22px] border-white/5" />

        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <Link
              href="/fantasy"
              className="text-xs font-bold text-white/65"
            >
              ← Fantasy
            </Link>

            <Link
              href="/match-admin"
              className="rounded-xl bg-white/10 px-3 py-2 text-[10px] font-black text-white"
            >
              Match Admin
            </Link>
          </div>

          <p className="mt-4 text-[9px] font-black uppercase tracking-[0.18em] text-white/45">
            Directiva
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            Administración
          </h1>

          <p className="mt-1 text-xs leading-5 text-white/60">
            Gestiona toda la estructura de Fantasy Regional.
          </p>
        </div>
      </header>

      <div className="px-4 pb-10">
        <section className="mt-4 rounded-[1.2rem] bg-[#e8f2ed] p-4">
          <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
            Orden recomendado
          </p>

          <p className="mt-1 text-sm font-black text-[#0b2f23]">
            Club → Equipo → Jugadores → Partidos
          </p>

          <p className="mt-1 text-[10px] leading-4 text-[#557368]">
            Crea primero la estructura deportiva y después configura partidos,
            usuarios y sincronizaciones.
          </p>
        </section>

        <section className="mt-5">
          <p className="mb-2 px-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
            Gestión general
          </p>

          <div className="space-y-3">
            {adminItems.map(
              (item) => (
                <Link
                  key={
                    item.href
                  }
                  href={
                    item.href
                  }
                  className="flex items-center justify-between rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-lg">
                      {
                        item.icon
                      }
                    </div>

                    <div className="min-w-0">
                      <p className="font-black text-zinc-950">
                        {
                          item.title
                        }
                      </p>

                      <p className="mt-0.5 text-[10px] leading-4 text-zinc-500">
                        {
                          item.description
                        }
                      </p>
                    </div>
                  </div>

                  <span className="ml-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-950 font-black text-white">
                    →
                  </span>
                </Link>
              ),
            )}
          </div>
        </section>

        <section className="mt-6">
          <Link
            href="/match-admin"
            className="flex items-center justify-between rounded-[1.3rem] bg-[#0f3d2e] p-4 text-white shadow-lg transition active:scale-[0.99]"
          >
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">
                Partidos
              </p>

              <p className="mt-1 font-black">
                Ir a Match Admin
              </p>

              <p className="mt-1 text-[10px] text-white/60">
                Convocatorias, estadísticas, votos y resultados
              </p>
            </div>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-black text-[#0f3d2e]">
              →
            </span>
          </Link>
        </section>
      </div>
    </main>
  );
}