import Link from "next/link";

import {
  FfcvSyncForm,
} from "./sync-form";

export default function FfcvSyncPage() {
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
            Datos oficiales
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight">
            FFCV
          </h1>

          <p className="mt-1 text-xs text-white/60">
            Sincronización de plantilla
          </p>
        </div>
      </header>

      <div className="px-4 pb-10">
        <section className="mt-4 rounded-[1.4rem] bg-[#e8f2ed] p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#0f3d2e] text-lg text-white">
              ↻
            </div>

            <div>
              <p className="font-black text-[#0b2f23]">
                Plantilla oficial
              </p>

              <p className="mt-1 text-[10px] leading-4 text-[#557368]">
                Consulta la plantilla publicada en FFCV y sincroniza
                jugadores, vínculos y fotografías con Fantasy Regional.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="mb-4">
            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-[#557368]">
              Sincronización
            </p>

            <h2 className="mt-1 text-lg font-black text-zinc-950">
              Actualizar jugadores
            </h2>

            <p className="mt-1 text-[10px] leading-4 text-zinc-500">
              Ejecuta la sincronización para buscar cambios en la plantilla
              oficial.
            </p>
          </div>

          <FfcvSyncForm />
        </section>

        <section className="mt-4 rounded-[1.2rem] bg-zinc-950 p-4 text-white">
          <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/40">
            Importante
          </p>

          <p className="mt-1 text-xs font-black">
            Revisa los cambios después de sincronizar
          </p>

          <p className="mt-1 text-[10px] leading-4 text-white/55">
            La sincronización puede actualizar fotografías o vínculos de
            jugadores. Comprueba la plantilla antes de utilizarla en un
            partido.
          </p>
        </section>

        <Link
          href="/admin/players"
          className="mt-4 flex min-h-12 w-full items-center justify-between rounded-[1.1rem] bg-white px-4 shadow-sm ring-1 ring-black/5"
        >
          <div>
            <p className="text-[8px] font-black uppercase tracking-wide text-zinc-400">
              Plantilla
            </p>

            <p className="mt-0.5 text-xs font-black text-zinc-950">
              Revisar jugadores
            </p>
          </div>

          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0f3d2e] text-xs font-black text-white">
            →
          </span>
        </Link>
      </div>
    </main>
  );
}