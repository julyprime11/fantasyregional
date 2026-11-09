-- Hotfix V3: the column DEFAULT was updated to v3, but its previous
-- CHECK constraint still only accepted v1/v2. This prevented new matches.
-- Preserve every existing row, score and scoring version.
BEGIN;

ALTER TABLE public.matches
  DROP CONSTRAINT matches_fantasy_scoring_version_check;

ALTER TABLE public.matches
  ADD CONSTRAINT matches_fantasy_scoring_version_check
  CHECK (fantasy_scoring_version IN ('v1', 'v2', 'v3'));

COMMIT;
