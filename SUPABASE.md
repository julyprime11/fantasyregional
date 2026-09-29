# Supabase foundation

Authentication, session/cookie handling, and row-level security (RLS) are not
implemented yet. The clients currently use anonymous access only. The existing
web page does not query Supabase and builds without Supabase credentials.

## Create a development project

1. Sign in at [Supabase](https://supabase.com/dashboard) and create a new project
   in your organization. Choose a name, region, and a strong database password.
2. Wait for provisioning. Find the project URL in the project's Connect dialog
   or API settings, and the publishable key under Settings > API Keys.
3. Copy `apps/web/.env.example` to `apps/web/.env.local` and replace the placeholders:

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

   These are public application settings. Never put a `service_role` key, secret
   API key, or database password in a `NEXT_PUBLIC_` variable. Keep `.env.local`
   out of version control. Restart the dev server after changing these values.
   Place this file in `apps/web/`, not in the generated `.next/` directory.

## Apply the initial migration manually

1. Open SQL Editor in your new development project and create a new query.
2. Paste the entire contents of
   `supabase/migrations/20260928000100_initial_schema.sql` and run it once.
3. Confirm that `clubs`, `teams`, `players`, `staff`, `seasons`, `competitions`,
   `matches`, `match_players`, and `ratings` exist in
   the `public` schema using Table Editor. The migration runs in a transaction
   and is intended for an empty schema; rerunning it will fail on existing tables.
4. Record that this migration was applied. Manual SQL Editor execution does not
   establish CLI migration history; reconcile that history before adopting CLI
   migrations later. No Supabase CLI is required for this phase.

The initial migration was redesigned before being applied. It contains only the
real-football MVP schema; there are no fantasy leagues, transfers, budgets, or
market values. Apply this replacement only to a fresh database.

- Clubs own teams; teams have players and staff. Competitions belong to seasons.
- Matches reference distinct home and away teams and an optional competition.
- Match players store participation and statistics, unique per match/player.
- Ratings store individual votes, unique per match/player/voter, with scores from 1 to 10.
- UUID primary keys default to `gen_random_uuid()` and all creation timestamps
  are required with `now()` defaults. Fields are required unless explicitly nullable.
- Player positions are `GK`, `RB`, `CB`, `LB`, `RWB`, `LWB`, `DM`, `CM`, `AM`,
  `RW`, `LW`, `ST`. Match statuses are `scheduled`, `finished`, `voting`, `closed`
  (default `scheduled`). Staff and voter roles remain text.
- Minutes, goals, assists, cards, shirt numbers, and match scores cannot be negative.
  Season end dates and voting close times cannot precede their corresponding start
  values when both are present.
- Deleting a match cascades to its participation records and votes. Deleting a
  competition clears the optional match reference. Other foreign-key deletions
  are restricted to protect historical records. Foreign keys have indexes, including
  the leading `match_id` columns of the participation/vote unique constraints.
- `voter_id` is a required UUID placeholder, without an auth foreign key. Voter
  authorization and voting-window enforcement are deferred. The schema does not yet
  enforce that a match player's team participates in that match or that a rated
  player appears in its squad. Squad additions check membership in the application;
  equivalent database enforcement and rating eligibility remain future work.

**RLS is deliberately not enabled.** Depending on the project's grants, public
API clients may read or modify these tables without user-specific restrictions.
Use a development project with non-sensitive data only until authentication and
RLS policies are implemented. Supabase may flag these tables as unprotected.

## Code organization

- `apps/web/src/lib/supabase/client.ts`: lazily initialized browser client.
- `apps/web/src/lib/supabase/server.ts`: fresh server-only anonymous client per call.
- `apps/web/src/lib/supabase/env.ts`: checks required settings when a client is created.
- `apps/web/src/lib/supabase/database.types.ts`: manual `Row`, `Insert`, `Update`,
  and relationship types matching the migration. Keep these synchronized with SQL
  until generated types are introduced.
- `apps/web/src/data/teams.ts`: `getTeams(): Promise<TeamRow[]>`.
- `apps/web/src/data/players.ts`: `getPlayers(): Promise<PlayerRow[]>` and
  `getPlayersByTeam(teamId: string): Promise<PlayerRow[]>`.

The data functions return database rows and propagate database
errors. Results are subject to the project's Data API row limit; pagination will
be needed before using these helpers for larger datasets. Nullable columns stay
nullable. Teams are sorted by name; players by first name then last name, with ID
as a stable tie-breaker. Position and match status types match the SQL checks.
These rows are not cast to the shared domain models. `packages/shared` remains
independent of Supabase; its `PlayerPosition` union stays strongly typed.

## Validation

From the repository root:

```sh
npm install
npm run lint
npm run typecheck
npm run build:web
```

Use `npm.cmd` if PowerShell blocks the `npm.ps1` wrapper. Running these checks does
not apply the migration or test a live database connection. Creating a client
without the required settings throws a configuration error when called.

References: [Supabase database tables](https://supabase.com/docs/guides/database/tables),
[API keys](https://supabase.com/docs/guides/getting-started/api-keys), and
[TypeScript support](https://supabase.com/docs/reference/javascript/typescript-support).

## Administration

`/admin` links to `/admin/clubs`, `/admin/teams`, `/admin/players`, and `/admin/staff`. Each page
lists database records and provides a create form backed by a Server Action.
Create a club before its teams, and a team before its players. Input validation
is shared TypeScript; database inserts use the existing typed server client.
Players can be edited at `/admin/players/[id]/edit`, including their team and active
status. Uncheck or check `Activo` to deactivate or activate a player without deleting
the record. The edit form uses the same validation as creation and returns to the
refreshed player list after saving. Missing records and failed updates show friendly errors.
Staff can be created at `/admin/staff` and edited at `/admin/staff/[id]/edit`,
including their team, free-text role, and active status. The same form component,
save handler, and common team-member validation are reused. Updates return to the
refreshed staff list, and deactivation preserves the record.
Matches can be listed and created at `/admin/matches` and edited at
`/admin/matches/[id]/edit`. Teams and optional competitions come from the database.
Dates are explicitly entered and displayed in UTC. Empty scores, competition, and
voting timestamps are saved as null. Validation rejects identical teams, invalid
dates/statuses, negative scores, and reversed voting windows. Saving refreshes the
list. This does not implement voting automation.

`/admin/matches/[id]` manages squads and player statistics for both teams. The
selector shows active players from either team and excludes current squad members.
The server rechecks eligibility and derives `team_id` from the selected player.
The existing unique constraint prevents duplicate match/player entries, including
concurrent duplicate submissions. Statistics updates and removals are scoped to
both the match ID and squad-entry ID. Existing entries remain editable if a player
later becomes inactive or changes teams; the recorded squad team is retained.
Removing a squad entry deletes its statistics for that match, but never the player.
Development voting is available at `/matches/[id]/vote` when running `npm run dev:web`
and the match status is `voting`. The admin management page links to it in that case.
Production builds disable this temporary flow in both the page and the submission
helper. Enter a valid voter UUID and a free-text role; this is a test identity, not
authentication. Keep the same UUID across submissions to exercise duplicate protection.
Only current squad members can be rated. Blank scores are skipped and at least one
score from 1 to 10 is required. Multiple ratings use one batch INSERT; a duplicate
match/player/voter rejects the entire batch without overwriting existing votes.
The server rechecks squad membership and match status before inserting. Without
database changes these checks are not transactional with concurrent squad/status
changes, and direct database access is not protected by them. Voting timestamps are
not used as gates yet; status controls opening.

`/admin/matches/[id]/results` calculates player ratings and the match MVP at read
time for voting (provisional) and closed (final) matches. Finished matches explain
that voting has not opened; scheduled matches have no calculated results.
The shared minimum-vote configuration defaults to 1, and exact top ties produce
joint MVPs. No calculated values are written to the database.
See [RATINGS.md](RATINGS.md) for the formula, minutes coefficients, role-weight
extension point, minimum-vote behavior, joint MVPs and deterministic tests.

No permanent deletion of master records, authentication, or RLS has been added. These routes are unrestricted
and intended for development until access controls are implemented.
