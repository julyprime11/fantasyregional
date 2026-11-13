-- Permitir subir fotografias manuales sin service_role.
-- Solo Directiva puede subir y consultar metadatos de manual/.
-- No se autoriza sobrescribir ni eliminar archivos.
BEGIN;

CREATE POLICY "player_images_manual_insert_directiva"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'player-images'
  AND (storage.foldername(name))[1] = 'manual'
  AND storage.extension(name) IN ('jpg', 'png')
  AND (SELECT app_private.is_directiva())
);

CREATE POLICY "player_images_manual_select_directiva"
ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'player-images'
  AND (storage.foldername(name))[1] = 'manual'
  AND (SELECT app_private.is_directiva())
);

COMMIT;
