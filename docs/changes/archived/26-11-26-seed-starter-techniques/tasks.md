# Tasks

### Group 1: The settle screen shows only the library

Covers: AC 3, AC 4. The built-in block and its fallback go first, so nothing is ever shown twice once the seed arrives. Until then a fresh library is simply empty and the gentle prompt shows.

- [x] Remove the fixed built-in block from the "Need to settle?" screen: delete the component that draws it and stop showing it under Do, so Do appears only when the user has an action, like the other groups
- [x] Remove the read-only fallback: when the items cannot be loaded, show only the calm message (reworded so it no longer promises built-in techniques), and when the library is empty keep the gentle prompt to add items
- [x] Keep the loading behaviour: nothing is shown until the items are read, so the prompt never flashes
- [x] Update the existing settle screen tests: techniques come from the library, not from fixed data; the empty, loading and failure cases; the shared style of every item and the group order; the library link and the calm note stay
- [x] Tests: with an empty library the screen shows the prompt and no groups; with items it shows only those, grouped, in one style; a failed read shows only the calm message and no techniques; no fixed technique can be found on the screen
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The backup reminder looks only at mood entries and thought records

Covers: AC 5, AC 6.

- [x] Change the "has data" check so it counts only mood entries and thought records, and no longer coping items
- [x] Update the reminder tests: a coping item alone no longer makes the reminder due (a new user with only a library is not nagged), mood entries and thought records still do, and the blocked-storage and failed-read cases behave as before
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Seed the three starters when the database is created

Covers: AC 1, AC 2, AC 7.

- [x] Reshape the fixed technique data in `src/coping/starters.ts` into the source of the seed: three "Do" items, the technique's name as the short text and its steps, numbered in the text, one per line as the detail; reword its comment, since it is no longer shown on its own
- [x] Add the seed to the database in `src/db/db.ts`, run only when the database is first created, with no schema version change and no upgrade step, so a deleted starter never comes back and an existing database is left alone
- [x] Make sure every fresh database in the tests starts with the three items: go through the tests that assume an empty library (the backup, coping, settle and database tests) and clear the library in their setup where they need to
- [x] Tests: a fresh database holds exactly the three starters in order, and every other table is empty; they pass the same checks as any item and fit the length limits, with the longest detail under 500 characters; reopening the database does not add them again; a deleted starter stays deleted after reopening; an edited starter keeps its edit; an existing version 4 or 5 database is not seeded when it upgrades or opens; a backup round trip keeps the starters and edits exactly; restoring a backup that has none leaves none; the settle screen shows the starters as ordinary items in one style, and deleting them all brings back the gentle prompt
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
