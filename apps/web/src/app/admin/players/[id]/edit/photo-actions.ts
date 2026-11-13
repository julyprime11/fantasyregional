"use server";

import { revalidatePath } from "next/cache";

import { parsePlayerId } from "@regional-fantasy/shared";

import { currentUserIsAdmin } from "@/lib/admin-auth";
import { getPlayerById, updatePlayer } from "@/data/players";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const BUCKET = "player-images";
const MAX_PHOTO_SIZE = 5 * 1024 * 1024;
const FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png)$/i;

export type PlayerPhotoResult =
  | { status: "success"; message: string; imageUrl: string }
  | { status: "error"; message: string };

/**
 * Relaciona una fotografía ya subida a Storage con un jugador.
 * La autorización se valida aquí y en las políticas RLS de Storage/players.
 * No recibe bytes ni URLs arbitrarias del cliente.
 */
export async function attachUploadedPlayerPhotoAction(
  playerId: string,
  storagePath: string,
): Promise<PlayerPhotoResult> {
  if (!(await currentUserIsAdmin())) {
    return { status: "error", message: "No tienes permisos para modificar jugadores." };
  }

  try {
    const parsedPlayerId = parsePlayerId(playerId);
    const prefix = `manual/${parsedPlayerId}/`;

    if (
      typeof storagePath !== "string" ||
      !storagePath.startsWith(prefix) ||
      !FILE_NAME.test(storagePath.slice(prefix.length))
    ) {
      return { status: "error", message: "La ruta de la fotografía no es válida." };
    }

    const player = await getPlayerById(parsedPlayerId);
    if (!player) {
      return { status: "error", message: "El jugador ya no existe." };
    }

    const supabase = await createServerSupabaseClient();
    const storage = supabase.storage.from(BUCKET);
    const { data: file, error: infoError } = await storage.info(storagePath);

    if (infoError || !file) {
      return { status: "error", message: "No se encontró la fotografía subida." };
    }

    // Comprobación adicional: el archivo existe y respeta el límite y
    // la correspondencia entre extensión y tipo real declarado por Storage.
    const details = file as {
      size?: number;
      contentType?: string;
      metadata?: { size?: number; mimetype?: string };
    };
    const size = Number(details.size ?? details.metadata?.size);
    const contentType =
      details.contentType?.toLowerCase() ??
      details.metadata?.mimetype?.toLowerCase();
    const isJpeg = storagePath.endsWith(".jpg") && contentType === "image/jpeg";
    const isPng = storagePath.endsWith(".png") && contentType === "image/png";

    if (!Number.isFinite(size) || size <= 0 || size > MAX_PHOTO_SIZE || (!isJpeg && !isPng)) {
      return { status: "error", message: "La fotografía no tiene un formato o tamaño válido." };
    }

    const { data: urlData } = storage.getPublicUrl(storagePath);
    if (!urlData.publicUrl) {
      return { status: "error", message: "No se pudo obtener la URL de la fotografía." };
    }

    await updatePlayer(parsedPlayerId, { image_url: urlData.publicUrl });

    revalidatePath(`/admin/players/${parsedPlayerId}/edit`);
    revalidatePath("/admin/players");
    revalidatePath("/fantasy", "layout");

    return {
      status: "success",
      message: "Fotografía guardada correctamente.",
      imageUrl: urlData.publicUrl,
    };
  } catch {
    return {
      status: "error",
      message: "No se pudo guardar la fotografía. Comprueba tu sesión e inténtalo de nuevo.",
    };
  }
}
