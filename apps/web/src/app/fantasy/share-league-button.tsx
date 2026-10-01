"use client";

import { useState } from "react";

type Props = {
  leagueName: string;
  code: string;
};

export default function ShareLeagueButton({
  leagueName,
  code,
}: Props) {
  const [copied, setCopied] =
    useState(false);

  async function shareLeague() {
    const baseUrl =
      window.location.origin;

    const inviteUrl =
      `${baseUrl}/fantasy/leagues/join?code=${encodeURIComponent(
        code,
      )}`;

    const text =
      `Únete a mi liga "${leagueName}" en Fantasy Regional.\n\n` +
      `Código: ${code}\n\n` +
      `Únete directamente aquí:\n${inviteUrl}`;

    try {
      if (
        typeof navigator !==
          "undefined" &&
        navigator.share
      ) {
        await navigator.share({
          title:
            "Fantasy Regional",
          text,
        });

        return;
      }

      await navigator.clipboard.writeText(
        text,
      );

      setCopied(true);

      window.setTimeout(
        () =>
          setCopied(false),
        2000,
      );
    } catch {
      // El usuario puede cancelar
      // el menú de compartir.
    }
  }

  return (
    <button
      type="button"
      onClick={
        shareLeague
      }
      className="flex h-11 min-w-11 items-center justify-center rounded-full bg-[#0f3d2e] px-3 text-sm font-black text-white active:scale-95"
      aria-label="Compartir liga"
    >
      {copied
        ? "✓"
        : "↗"}
    </button>
  );
}