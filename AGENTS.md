# Regional Fantasy

## Project overview

Regional Fantasy is a football rating and fantasy platform focused on regional and amateur football.

The platform will have:

- Web application
- iOS application
- Android application
- Shared backend and database

The initial language of the application is Spanish.

## Architecture

This repository is a monorepo.

Main structure:

- apps/web: Next.js web application
- apps/mobile: React Native / Expo mobile application (to be created later)
- packages/shared: shared TypeScript types, validation and business logic
- packages/database: shared database/Supabase utilities (to be created later)

Backend:
- Supabase
- PostgreSQL
- Supabase Auth
- Supabase Storage

Web:
- Next.js
- React
- TypeScript
- Tailwind CSS

Mobile:
- React Native
- Expo
- TypeScript

## Core domain

The application manages:

- Clubs
- Teams
- Seasons
- Competitions
- Players
- Coaching staff
- Matches
- Match squads
- Player statistics
- Rating panels
- Votes
- Player ratings
- MVP rankings

## Rating system

Players receive a final rating from 1 to 10.

The final rating will eventually combine:

1. Human panel votes
2. Match statistics
3. Minutes played
4. Position-specific modifiers

Examples of statistics:

- Goals
- Assists
- Yellow cards
- Red cards
- Clean sheets
- Minutes played

The scoring formula must NOT be hardcoded into UI components.

Scoring and ranking logic should live in shared business logic so that web and mobile use exactly the same calculations.

## Voting

A team can have a limited panel of authorized voters.

Voters may include:

- Players
- Coaching staff
- Directors
- Other authorized members

Each authorized user can vote only once for each player in each match.

Voting weights may eventually differ depending on voter role.

## Development rules

- Use TypeScript.
- Prefer strict typing.
- Do not use `any` unless absolutely necessary.
- Keep components small and focused.
- Separate UI, database access and business logic.
- Do not duplicate business logic between web and mobile.
- Shared logic belongs in packages/shared.
- Do not hardcode secrets or API keys.
- Use environment variables for credentials.
- Do not make large architectural changes without explaining them first.
- Do not add dependencies unless they are necessary.
- Preserve compatibility with the future Expo mobile application.
- Database changes must be explicit and documented.
- Prefer simple maintainable solutions over unnecessary complexity.

## Working with Codex

Before making a large change:

1. Inspect the existing project.
2. Explain briefly what will be changed.
3. Identify files that will be created or modified.
4. Implement the change.
5. Run relevant lint/type checks.
6. Report errors or warnings instead of hiding them.

Do not rewrite unrelated parts of the project.

## Current development phase

We are building the MVP.

Initial development order:

1. Project architecture
2. Supabase integration
3. Authentication
4. Clubs and teams
5. Players and coaching staff
6. Matches
7. Match squads and statistics
8. Voting
9. Rating calculation
10. MVP and rankings

Advanced features should not be implemented until the core MVP works.