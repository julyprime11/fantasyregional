"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { attachUploadedPlayerPhotoAction } from "./photo-actions";

const BUCKET = "player-images";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

type Props = {
  playerId: string;
  playerName: string;
  currentImageUrl: string | null;
};

type Feedback = { status: "success" | "error"; message: string } | null;

/** Se verifica la cabecera del fichero antes de subirlo, no solo la extensión. */
async function detectPhotoType(file: File): Promise<"jpg" | "png"> {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const jpeg = header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff;
  const png =
    header[0] === 0x89 && header[1] === 0x50 &&
    header[2] === 0x4e && header[3] === 0x47 &&
    header[4] === 0x0d && header[5] === 0x0a &&
    header[6] === 0x1a && header[7] === 0x0a;

  if (jpeg && (!file.type || file.type === "image/jpeg" || file.type === "image/jpg")) {
    return "jpg";
  }
  if (png && (!file.type || file.type === "image/png")) {
    return "png";
  }
  throw new Error("Selecciona una imagen JPG o PNG. Las fotos HEIC deben convertirse primero.");
}

export function PlayerPhotoUploadForm({
  playerId,
  playerName,
  currentImageUrl,
}: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [selectedName, setSelectedName] = useState("");
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [feedback, setFeedback] = useState<Feedback>(null);

  async function uploadPhoto(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;

    setFeedback(null);
    const file = fileInput.current?.files?.[0];
    if (!file) {
      setFeedback({ status: "error", message: "Selecciona primero una fotografía." });
      return;
    }
    if (file.size === 0 || file.size > MAX_PHOTO_SIZE) {
      setFeedback({ status: "error", message: "La fotografía debe ocupar como máximo 5 MB." });
      return;
    }

    setPending(true);
    try {
      const extension = await detectPhotoType(file);
      const contentType = extension === "jpg" ? "image/jpeg" : "image/png";
      const path = `manual/${playerId}/${crypto.randomUUID()}.${extension}`;
      const supabase = createBrowserSupabaseClient();

      // El archivo va directamente a Storage: no atraviesa el limite de
      // tamaño de las Server Actions de Vercel.
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(
        path,
        file,
        { contentType, upsert: false, cacheControl: "3600" },
      );

      if (uploadError) {
        throw new Error("No se pudo subir la imagen. Comprueba los permisos de Directiva.");
      }

      const result = await attachUploadedPlayerPhotoAction(playerId, path);
      if (result.status === "error") {
        throw new Error(result.message);
      }

      setImageUrl(result.imageUrl);
      setFeedback({ status: "success", message: result.message });
      setSelectedName("");
      if (fileInput.current) fileInput.current.value = "";
      router.refresh();
    } catch (error) {
      setFeedback({
        status: "error",
        message: error instanceof Error ? error.message : "No se pudo subir la fotografía.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="mt-4 rounded-[1.4rem] bg-white p-4 shadow-sm ring-1 ring-black/5">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[#557368]">
        Fotografía
      </p>
      <h2 className="mt-1 text-lg font-black text-zinc-950">Subir foto del jugador</h2>
      <p className="mt-1 text-xs leading-5 text-zinc-500">
        Desde la galería del móvil o el ordenador. JPG o PNG, máximo 5 MB.
        No depende de la sincronización FFCV.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[#e8f2ed] text-[#0f3d2e]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={`Fotografía de ${playerName}`}
              width={80}
              height={80}
              unoptimized
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-3xl" aria-hidden="true">👤</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-zinc-950">
            {imageUrl ? "Foto actual" : "Sin fotografía"}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-zinc-500">
            La nueva foto sustituirá la anterior sin modificar otros datos.
          </p>
        </div>
      </div>

      <form onSubmit={(event) => { void uploadPhoto(event); }} className="mt-4 space-y-3">
        <label htmlFor="player-photo" className="block text-[10px] font-black uppercase tracking-wide text-zinc-600">
          Seleccionar fotografía
        </label>
        <input
          id="player-photo"
          ref={fileInput}
          name="photo"
          type="file"
          accept="image/jpeg,image/png"
          disabled={pending}
          required
          onChange={(event) => {
            setSelectedName(event.currentTarget.files?.[0]?.name ?? "");
            setFeedback(null);
          }}
          className="block w-full rounded-xl bg-zinc-50 p-3 text-xs text-zinc-800 file:mr-3 file:rounded-lg file:border-0 file:bg-[#e8f2ed] file:px-3 file:py-2 file:font-black file:text-[#0f3d2e] focus:outline-none focus:ring-2 focus:ring-[#0f3d2e]"
        />
        {selectedName && (
          <p className="break-all text-[11px] text-zinc-500">{selectedName}</p>
        )}
        <button
          type="submit"
          disabled={pending}
          className="flex min-h-12 w-full items-center justify-center rounded-xl bg-[#0f3d2e] px-4 text-sm font-black text-white shadow-sm disabled:cursor-wait disabled:opacity-60"
        >
          {pending ? "Subiendo fotografía…" : "Subir foto"}
        </button>
        {feedback && (
          <p
            role={feedback.status === "error" ? "alert" : "status"}
            className={`rounded-xl px-3 py-2 text-xs font-bold ${feedback.status === "error" ? "bg-red-50 text-red-700" : "bg-[#e8f2ed] text-[#0f3d2e]"}`}
          >
            {feedback.message}
          </p>
        )}
      </form>
      <p className="mt-3 text-[10px] leading-4 text-zinc-500">
        Si estás editando otros datos, guárdalos antes de subir la foto.
        La fotografía manual tiene prioridad sobre la sincronización FFCV.
      </p>
    </section>
  );
}
