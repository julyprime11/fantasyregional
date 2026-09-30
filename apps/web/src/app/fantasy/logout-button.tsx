"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();

  const [pending, setPending] =
    useState(false);

  async function handleLogout() {
    setPending(true);

    const supabase =
      createBrowserSupabaseClient();

    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={
        handleLogout
      }
      disabled={pending}
      className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-zinc-700 shadow-sm ring-1 ring-zinc-200 disabled:opacity-50"
    >
      {pending
        ? "Saliendo..."
        : "Cerrar sesión"}
    </button>
  );
}