# Tasks

### Group 1: Alias and the tests folder

Covers: AC 1, 2, 4. Moves every test in one go, so the app never has tests half-moved. The tests are also the first users of the new alias in the runner, the type-checker and the linter.

- [x] Define the `@` alias for `src/` in the TypeScript config and in the Vite config, which the test runner reuses, and keep both in sync
- [x] Create `tests/` mirroring `src/`: move the start screen test to `tests/`, and the three database tests to `tests/db/`, importing the code under test through `@`
- [x] Move the shared test setup to `tests/setup.ts` and point the test runner at it
- [x] Move the PWA configuration test into `tests/`, keep its Node environment, and fix its path to the public icons (it imports the root config relatively, the one exception, pending the user's confirmation in the ticket)
- [x] Give `tests/` its own type-check project (browser types for the component and database tests, Node types for the PWA test) and register it with the root TypeScript config, so the tests stay type-checked now that they are outside `src/`
- [x] Point the test runner's file pattern at `tests/` only, and confirm ESLint still lints the moved files with type-aware rules
- [x] Confirm the suite runs the same number of tests as before (16 tests in 5 files), none skipped or weakened
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Source imports and cleanup

Covers: AC 3, 5, 6.

- [x] Switch imports that cross folders in `src/` to the `@` alias (the startup import in the entry file), and leave same-folder imports relative
- [x] Remove the now-empty `src/test/` folder, and search to confirm no test or setup file remains inside `src/` or at the project root
- [x] Confirm the production bundle contains no test code and no test-only dependencies
- [x] Verify by hand against a production preview that the app still shows its start screen and that the manifest and service worker are still generated
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
