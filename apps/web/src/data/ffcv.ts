import "server-only";

import {
  createAdminSupabaseClient,
} from "@/lib/supabase/admin";

type FfcvPlayer = {
  foto: string | null;

  codjugador: string;

  nombre: string;

  email: string | null;

  dorsal: string | null;

  posicion: string | null;
};

type FfcvSquadResponse = {
  estado: string;

  sesion_ok: string;

  jugadores_equipo:
    FfcvPlayer[];
};

export type FfcvSyncResult = {
  total: number;

  matched: number;

  updated: number;

  unmatched: string[];

  errors: string[];
};

const CASTELLO_FFCV_TEAM_CODE =
  "903601725";

const FFCV_URL =
  `https://ffcv.es/competiciones/api/equipos/plantilla_home.php?cod_equipo=${CASTELLO_FFCV_TEAM_CODE}`;

const STORAGE_BUCKET =
  "player-images";

function normalizeText(
  value: string,
): string {
  return value
    .normalize("NFD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toUpperCase()
    .replace(
      /[^A-Z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function normalizeFfcvName(
  value: string,
): string {
  /*
   * FFCV suele devolver:
   *
   * APELLIDOS, NOMBRE
   *
   * Lo convertimos a:
   *
   * NOMBRE APELLIDOS
   */
  const parts =
    value.split(",");

  if (
    parts.length >=
    2
  ) {
    const lastName =
      parts[0]?.trim() ??
      "";

    const firstName =
      parts
        .slice(1)
        .join(",")
        .trim();

    return normalizeText(
      `${firstName} ${lastName}`,
    );
  }

  return normalizeText(
    value,
  );
}

function normalizeLocalName(
  firstName: string,
  lastName: string | null,
): string {
  return normalizeText(
    `${firstName} ${
      lastName ?? ""
    }`,
  );
}

function decodeDataImage(
  dataUrl: string,
): {
  bytes: Buffer;
  contentType: string;
  extension: string;
} {
  const commaIndex =
    dataUrl.indexOf(",");

  if (
    commaIndex ===
    -1
  ) {
    throw new Error(
      "Imagen FFCV no válida.",
    );
  }

  const encoded =
    dataUrl.slice(
      commaIndex +
        1,
    );

  const bytes =
    Buffer.from(
      encoded,
      "base64",
    );

  /*
   * Detectamos JPEG por magic bytes FF D8 FF.
   *
   * El endpoint de FFCV puede declarar PNG
   * aunque el contenido real sea JPEG.
   */
  const isJpeg =
    bytes.length >=
      3 &&
    bytes[0] ===
      0xff &&
    bytes[1] ===
      0xd8 &&
    bytes[2] ===
      0xff;

  if (isJpeg) {
    return {
      bytes,
      contentType:
        "image/jpeg",
      extension:
        "jpg",
    };
  }

  const isPng =
    bytes.length >=
      8 &&
    bytes[0] ===
      0x89 &&
    bytes[1] ===
      0x50 &&
    bytes[2] ===
      0x4e &&
    bytes[3] ===
      0x47;

  if (isPng) {
    return {
      bytes,
      contentType:
        "image/png",
      extension:
        "png",
    };
  }

  throw new Error(
    "Formato de imagen FFCV no soportado.",
  );
}

async function ensureBucket(): Promise<void> {
  const supabase =
    createAdminSupabaseClient();

  const {
    data,
    error,
  } =
    await supabase
      .storage
      .getBucket(
        STORAGE_BUCKET,
      );

  if (
    data &&
    !error
  ) {
    return;
  }

  const {
    error:
      createError,
  } =
    await supabase
      .storage
      .createBucket(
        STORAGE_BUCKET,
        {
          public:
            true,

          fileSizeLimit:
            5 *
            1024 *
            1024,

          allowedMimeTypes: [
            "image/jpeg",
            "image/png",
          ],
        },
      );

  if (
    createError &&
    !createError.message
      .toLowerCase()
      .includes(
        "already exists",
      )
  ) {
    throw createError;
  }
}

export async function syncCastelloPlayersFromFfcv(
  teamId: string,
): Promise<FfcvSyncResult> {
  const response =
    await fetch(
      FFCV_URL,
      {
        method:
          "GET",

        cache:
          "no-store",

        headers: {
          Accept:
            "application/json",
        },
      },
    );

  if (
    !response.ok
  ) {
    throw new Error(
      `FFCV respondió ${response.status}.`,
    );
  }

  const payload =
    (
      await response.json()
    ) as FfcvSquadResponse;

  if (
    payload.estado !==
      "1" ||
    !Array.isArray(
      payload.jugadores_equipo,
    )
  ) {
    throw new Error(
      "La respuesta de FFCV no contiene una plantilla válida.",
    );
  }

  const supabase =
    createAdminSupabaseClient();

  const {
    data:
      localPlayers,
    error:
      playersError,
  } =
    await supabase
      .from("players")
      .select(
        `
          id,
          first_name,
          last_name,
          ffcv_player_code
        `,
      )
      .eq(
        "team_id",
        teamId,
      );

  if (
    playersError
  ) {
    throw playersError;
  }

  await ensureBucket();

  const localByCode =
    new Map(
      localPlayers
        .filter(
          (
            player,
          ) =>
            player.ffcv_player_code,
        )
        .map(
          (
            player,
          ) => [
            player.ffcv_player_code!,
            player,
          ],
        ),
    );

  const localByName =
    new Map(
      localPlayers.map(
        (
          player,
        ) => [
          normalizeLocalName(
            player.first_name,
            player.last_name,
          ),
          player,
        ],
      ),
    );

  const result: FfcvSyncResult = {
    total:
      payload
        .jugadores_equipo
        .length,

    matched:
      0,

    updated:
      0,

    unmatched:
      [],

    errors:
      [],
  };

  for (
    const ffcvPlayer of
    payload.jugadores_equipo
  ) {
    try {
      /*
       * Primero buscamos por código FFCV.
       *
       * Si todavía no está vinculado,
       * hacemos una primera coincidencia
       * por nombre normalizado.
       */
      const localPlayer =
        localByCode.get(
          ffcvPlayer.codjugador,
        ) ??
        localByName.get(
          normalizeFfcvName(
            ffcvPlayer.nombre,
          ),
        );

      if (
        !localPlayer
      ) {
        result.unmatched.push(
          ffcvPlayer.nombre,
        );

        continue;
      }

      result.matched +=
        1;

      let imageUrl:
        string | undefined;

      if (
        ffcvPlayer.foto &&
        ffcvPlayer.foto.startsWith(
          "data:image/",
        )
      ) {
        const image =
          decodeDataImage(
            ffcvPlayer.foto,
          );

        const storagePath =
          `ffcv/${ffcvPlayer.codjugador}.${image.extension}`;

        const {
          error:
            uploadError,
        } =
          await supabase
            .storage
            .from(
              STORAGE_BUCKET,
            )
            .upload(
              storagePath,
              image.bytes,
              {
                contentType:
                  image.contentType,

                upsert:
                  true,

                cacheControl:
                  "3600",
              },
            );

        if (
          uploadError
        ) {
          throw uploadError;
        }

        const {
          data:
            publicUrlData,
        } =
          supabase
            .storage
            .from(
              STORAGE_BUCKET,
            )
            .getPublicUrl(
              storagePath,
            );

        imageUrl =
          publicUrlData
            .publicUrl;
      }

      const {
        error:
          updateError,
      } =
        await supabase
          .from("players")
          .update({
            ffcv_player_code:
              ffcvPlayer.codjugador,

            ffcv_last_sync_at:
              new Date()
                .toISOString(),

            ...(imageUrl
              ? {
                  image_url:
                    imageUrl,
                }
              : {}),
          })
          .eq(
            "id",
            localPlayer.id,
          );

      if (
        updateError
      ) {
        throw updateError;
      }

      result.updated +=
        1;
    } catch (
      error
    ) {
      result.errors.push(
        `${
          ffcvPlayer.nombre
        }: ${
          error instanceof
          Error
            ? error.message
            : "Error desconocido"
        }`,
      );
    }
  }

  return result;
}