-- Jornada oficial de cada partido, independiente del orden de carga.
-- Nullable para partidos sin calendario de liga asignado.
BEGIN;

ALTER TABLE public.matches
  ADD COLUMN IF NOT EXISTS matchday_number integer;

ALTER TABLE public.matches
  DROP CONSTRAINT IF EXISTS matches_matchday_number_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_matchday_number_check
  CHECK (matchday_number BETWEEN 1 AND 60);

-- Correspondencia confirmada para Castelló: jornadas 5 a 8.
-- No se utilizan IDs generados ni se cambia ninguna puntuación.
UPDATE public.matches AS m
SET matchday_number = fixture.matchday_number
FROM (
  VALUES
    ('2026-10-25 15:30:00+00'::timestamptz, 5),
    ('2026-10-31 15:30:00+00'::timestamptz, 6),
    ('2026-11-08 11:00:00+00'::timestamptz, 7),
    ('2026-11-14 15:30:00+00'::timestamptz, 8)
) AS fixture(match_date, matchday_number)
JOIN public.teams AS castellon
  ON castellon.name = 'C.F. Castelló de les Gerres Amateur'
WHERE m.match_date = fixture.match_date
  AND (m.home_team_id = castellon.id OR m.away_team_id = castellon.id)
  AND m.matchday_number IS NULL;

COMMENT ON COLUMN public.matches.matchday_number IS
  'Número de jornada oficial del calendario. No inferir del orden de fechas.';

COMMIT;
