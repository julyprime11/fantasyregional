"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

/** Refresco manual mientras se implementa la suscripción Realtime del bloque 3. */
export default function RefreshLiveMatch() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      aria-label="Actualizar el marcador y las alineaciones"
      className="flex min-h-10 items-center gap-1.5 rounded-lg bg-[#e8f2ed] px-3 text-[11px] font-black text-[#0f3d2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f3d2e] disabled:opacity-50"
    >
      <span aria-hidden="true">↻</span>
      {pending ? "Actualizando…" : "Actualizar"}
    </button>
  );
}
