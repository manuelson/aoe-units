# Migrations

These SQL files are the seed of record for the catalog.

`0002`–`0004` were generated once from the hardcoded TypeScript data that used to live
in `lib/db/` and `lib/units/translations/` (111 unit lines, 209 units, 758 counter
edges, en/es names). That source and its generator (`scripts/gen-seed.ts`) were deleted
once the data was in Postgres, since keeping two copies of the same catalog invites
them to drift. To rebuild the database from scratch, apply these files in order.

Anything after `0004` is a schema or data change made since.

The original TypeScript remains in git history if it is ever needed:

    git log --diff-filter=D --name-only -- lib/db
