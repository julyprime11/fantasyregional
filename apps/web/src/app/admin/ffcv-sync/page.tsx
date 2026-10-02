import Link from "next/link";

import {
  FfcvSyncForm,
} from "./sync-form";

export default function FfcvSyncPage() {
  return (
    <main className="app-screen mx-auto max-w-xl bg-[#f2f4f2]">
      <header className="relative overflow-hidden rounded-b-[1.8rem] bg-[#0f3d2e] px-4 pb-4 pt-[calc(env(safe-area-inset-top)+0.65rem)] text-white shadow-lg">
        <div className="absolute -right-14 -top-16 h-40 w-40 rounded-full border-[24px] border-white/5" />

        <div className="relative z-10">
          <Link
            href="/fantasy"
            className="text-xs font-bold text-white/65"
          >
            ← Fantasy
          </Link>

          <p className="mt-3 text-[8px] font-black uppercase tracking-[0.18em] text-white/45">
            Administración
          </p>

          <h1 className="mt-0.5 text-[2rem] font-black tracking-tight">
            FFCV
          </h1>

          <p className="mt-0.5 text-xs text-white/55">
            Sincronización del Castelló de les Gerres
          </p>
        </div>
      </header>

      <div className="px-4 pb-8">
        <section className="mt-4 rounded-[1.2rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
          <p className="text-sm font-black text-zinc-950">
            Plantilla oficial
          </p>

          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Descarga la plantilla de FFCV, vincula los jugadores existentes y actualiza sus fotografías.
          </p>

          <div className="mt-4">
            <FfcvSyncForm />
          </div>
        </section>
      </div>
    </main>
  );
}