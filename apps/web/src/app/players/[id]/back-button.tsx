"use client";

import {
  useRouter,
} from "next/navigation";

type Props = {
  variant?:
    | "header"
    | "footer";
};

export default function BackButton({
  variant = "header",
}: Props) {
  const router =
    useRouter();

  if (
    variant ===
    "footer"
  ) {
    return (
      <button
        type="button"
        onClick={() =>
          router.back()
        }
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[1rem] bg-white px-4 text-sm font-black text-[#0f3d2e] shadow-sm ring-1 ring-black/5 transition active:scale-[0.99]"
      >
        <span aria-hidden="true">
          ←
        </span>

        <span>
          Volver
        </span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() =>
        router.back()
      }
      className="inline-flex min-h-9 items-center gap-2 rounded-full bg-white/10 px-3 text-[11px] font-black text-white/85 ring-1 ring-white/10 backdrop-blur-sm transition active:scale-[0.97]"
    >
      <span aria-hidden="true">
        ←
      </span>

      <span>
        Volver
      </span>
    </button>
  );
}