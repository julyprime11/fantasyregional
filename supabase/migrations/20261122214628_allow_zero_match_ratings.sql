-- Admitir la nota 0 en las votaciones del partido.
-- La interfaz, parseRatingInput y el cálculo de valoración aceptan 0..10.
-- El CHECK original (1..10) provocaba error 23514 en los envíos con 0.
-- Aplicada previamente en producción como hotfix; esta migración
-- documenta el mismo cambio, sin modificar votos ni políticas RLS.
BEGIN;

DO $$
DECLARE
  existing_constraint text;
BEGIN
  SELECT pg_get_constraintdef(oid)
  INTO existing_constraint
  FROM pg_constraint
  WHERE conrelid = 'public.ratings'::regclass
    AND conname = 'ratings_score_range';

  IF existing_constraint IS NULL THEN
    RAISE EXCEPTION 'No existe ratings_score_range';
  END IF;

  -- Permite re-ejecutar contra una BD que ya recibió el hotfix.
  IF existing_constraint LIKE '%score >= (0)::numeric%' THEN
    RETURN;
  END IF;

  IF existing_constraint NOT LIKE '%score >= (1)::numeric%'
     OR existing_constraint NOT LIKE '%score <= (10)::numeric%' THEN
    RAISE EXCEPTION 'Constraint inesperada: %', existing_constraint;
  END IF;

  ALTER TABLE public.ratings DROP CONSTRAINT ratings_score_range;
  ALTER TABLE public.ratings ADD CONSTRAINT ratings_score_range
    CHECK (score >= 0 AND score <= 10);
END $$;

COMMIT;
