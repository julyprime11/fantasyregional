# Initial player ratings and match MVP

The engine is in `packages/shared/src/ratings.ts`. It has no framework, database,
browser, or Node runtime dependency. Calculations are read-only and not persisted.
The web results page accepts `voting` (provisional results and MVP) and `closed`
(final results and MVP). Scheduled matches have no results; finished matches show
that voting has not opened. Provisional results can change as new votes arrive.

## Formula

Panel average is `sum(score * roleWeight) / sum(roleWeight)`. Every role defaults
to weight 1, including unknown roles. An optional weight map allows future changes;
configured weights must be finite and strictly positive. The web uses equal weights.
`RatingConfig` exposes `minimumVotes` and `roleWeights`. `DEFAULT_RATING_CONFIG`
defines the development minimum of 1 in one place. Pass a partial configuration to
`calculatePlayerRating` or `getMatchResults` to override it. `minimumVotes` must be
a positive integer; invalid thresholds throw a configuration error.

Statistical modifiers:

| Position group | Positions | Goal | Clean sheet |
| --- | --- | --- | --- |
| Goalkeeper | GK | +2.0 | +0.8 |
| Defenders | RB, CB, LB, RWB, LWB | +1.5 | +0.6 |
| Midfielders | DM, CM, AM | +1.2 | +0.2 |
| Forwards | RW, LW, ST | +1.0 | 0 |

Each assist adds 0.5, yellow card subtracts 0.3, and red card subtracts 1.5.
Cards are applied independently using the stored counts. Clean-sheet bonus applies
once when the flag is true; the engine does not infer it from the match result.

| Minutes | Modifier coefficient |
| --- | --- |
| 0 | Not rateable |
| 1–9 | 0.1 |
| 10–29 | 0.4 |
| 30–59 | 0.7 |
| 60+ | 1.0 |

`statistical_score = clamp(6 + coefficient * sum(modifiers), 1, 10)`

`final_rating = clamp(0.7 * panel_average + 0.3 * statistical_score, 1, 10)`

Minutes attenuate both positive and negative modifiers around the neutral base of
6; they do not reduce the base itself or alter the 70/30 split. Thus a forward with
one goal, 90 minutes, and panel average 8 has statistics 7 and final rating 7.7.
With 5 minutes the same player's statistics are 6.1 and final rating 7.43.

## Missing data and MVP

Results include player ID, panel average, statistical score, final rating, vote
count, status and reason. Zero minutes returns `no_minutes` and no statistical or
final score. A vote count below `minimumVotes` returns `insufficient_votes`, with
the available panel average and statistical score but no final score. No votes
means a null panel average. Invalid position, counts, scores, or weights return `invalid_data`.
No missing values are replaced with invented panel votes. Zero minutes takes
precedence over missing votes. Invalid numeric source data is rejected first.

MVP includes every rateable player tied at the highest unrounded final rating.
`MatchMvpResult` contains `status` (`none`, `single`, `shared`), `players`, and
`final_rating`. Players are ordered by ID only for deterministic presentation;
IDs never exclude a tied winner. Shared winners display "MVP compartido". If nobody
is rateable, the player list is empty and the MVP rating is null. Only display
values are rounded to two decimals; rounded equality does not count as a tie.

The adapter uses current player positions and current source data, including all
roles equally. Votes are fetched in pages to avoid truncating the panel average.
Votes for players outside the current squad do not enter results. Reads are not a
transactional snapshot; concurrent source edits may require reloading the page.
No historical position snapshot, weighted-role policy, or fantasy-user points are
implemented yet. Existing voting remains development-only.

## Tests

Run `npm run test:ratings` at the repository root. Tests use Node's built-in test
runner and TypeScript stripping (Node 22.6+; this project was validated on Node 24).
No test dependency or database credentials are needed.
