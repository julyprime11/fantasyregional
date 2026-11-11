"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type ConnectionState = "connecting" | "connected" | "reconnecting";

/**
 * El servidor es la única fuente de verdad de puntos y marcador.
 * Realtime solo avisa que hay datos nuevos: router.refresh() vuelve a
 * calcular el partido, ambos XI y el timeline en el servidor.
 */
export default function RefreshLiveMatch({ matchId }: { matchId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastRefresh = useRef(0);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let mounted = true;

    const scheduleRefresh = (minDelay = 400) => {
      if (!mounted || document.visibilityState !== "visible") return;

      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      // Agrupa en una sola petición el cambio en match_players y su
      // evento cronológico, que llegan de la misma transacción.
      refreshTimer.current = setTimeout(() => {
        if (!mounted || document.visibilityState !== "visible") return;
        lastRefresh.current = Date.now();
        startTransition(() => router.refresh());
      }, minDelay);
    };

    const channel = supabase
      .channel(`fantasy-live-${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "match_players",
          filter: `match_id=eq.${matchId}`,
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "match_events",
          filter: `match_id=eq.${matchId}`,
        },
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "match_events",
        },
        // Supabase no garantiza filtros de DELETE con la identidad
        // de réplica por defecto. Refrescar también en una corrección.
        () => scheduleRefresh(),
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "matches",
          filter: `id=eq.${matchId}`,
        },
        () => scheduleRefresh(),
      )
      .subscribe((state) => {
        if (!mounted) return;
        if (state === "SUBSCRIBED") {
          setConnection("connected");
          // Recupera cambios ocurridos durante la conexión inicial.
          scheduleRefresh();
        } else if (
          state === "CHANNEL_ERROR" ||
          state === "TIMED_OUT" ||
          state === "CLOSED"
        ) {
          setConnection("reconnecting");
        }
      });

    // Respaldo si el dispositivo pierde notificaciones. Solo en pestañas
    // visibles para reducir tráfico y renovaciones de sesión de Auth.
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        scheduleRefresh(0);
      }
    }, 90_000);

    const onVisible = () => {
      if (
        document.visibilityState === "visible" &&
        Date.now() - lastRefresh.current > 15_000
      ) {
        scheduleRefresh(0);
      }
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      mounted = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
        refreshTimer.current = null;
      }
      void supabase.removeChannel(channel);
    };
  }, [matchId, router, startTransition]);

  return (
    <div className="flex flex-wrap items-center justify-center gap-1.5">
      <span
        className={
          "text-[9px] font-bold " +
          (connection === "connected" ? "text-emerald-700" : "text-zinc-500")
        }
        role="status"
        aria-live="polite"
      >
        {connection === "connected"
          ? "● Sincronizado"
          : connection === "connecting"
            ? "Conectando…"
            : "Reconectando…"}
      </span>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          lastRefresh.current = Date.now();
          startTransition(() => router.refresh());
        }}
        aria-label="Actualizar el marcador, los puntos y la cronología"
        className="flex min-h-10 items-center gap-1.5 rounded-lg bg-[#e8f2ed] px-3 text-[11px] font-black text-[#0f3d2e] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0f3d2e] disabled:opacity-50"
      >
        <span aria-hidden="true">↻</span>
        {pending ? "Actualizando…" : "Actualizar"}
      </button>
    </div>
  );
}
