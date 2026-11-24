---
title: Centralize tests
type: refactor
priority: medium
status: done
date: 2026-11-24
modules: [app-shell]
synced: true
---

## User Story

As the developer of cebete, I want every test in one top-level folder that mirrors the source layout, so that I always know where tests live and the source folder holds only shipped code.

## Goal

Bring the existing code into line with the project's code conventions on tests and imports. Doing it now, with only a handful of tests, is far cheaper than after the remaining modules add many more.

## Scope

**In scope**
- Move every existing test and the shared test setup into a top-level `tests/` folder that mirrors `src/`.
- Introduce the `@` alias for `src/`, and use it for imports that cross folders in source and in tests.
- Make type-checking, linting, formatting and the test runner cover the new folder.
- Update the app-shell doc where it describes where tests live.

**Out of scope**
- Writing new tests or changing what existing tests check.
- Changing how the app behaves or how it is built.
- Import ordering rules beyond what lint already enforces.

No dependencies. It should land before the remaining tickets, so their new tests follow this layout from the start.

## Behavior

The app behaves exactly as before. For the developer, every test, including the PWA configuration test and the shared setup, lives under `tests/`, laid out like `src/`: the database tests under `tests/db/`, the start screen test at the top, and so on. Nothing test-related remains inside `src/` or at the project root. Source and tests import across folders through the `@` alias. A relative import stays only for a file in the same folder.

## Decisions

- Dedicated `tests/` folder mirroring `src/`, as set out in the project's code conventions.
- The `@` alias resolves the same way for the editor, the build and the test runner.
- Rejected: tests beside their source files (conflicts with the conventions); a flat `tests/` folder (does not scale as modules grow); long relative paths into `src/` (hard to read and to move).

## Constraints and edge cases

- Every existing test still runs and passes, with none skipped, removed or weakened. The test count is unchanged.
- The alias is defined in the TypeScript configuration, the Vite configuration and the test runner configuration, and the three stay in sync.
- The PWA configuration test keeps running in a Node environment and still verifies the real icon files.
- The test setup file keeps applying to every test.
- No test code reaches the production bundle.
- The five checks keep passing in the order set by the workflow conventions, and from PowerShell on this machine.

## Risks and open questions

- The PWA configuration file sits at the project root, outside `src/`, so the `@` alias does not reach it. The default is a single relative import for that one test, as the only exception to the alias rule. Please confirm, or ask for a second alias for the root config.

## Acceptance Criteria

- [x] When a developer looks for tests, all of them are under the top-level `tests/` folder, laid out like the source folders.
- [x] No test or test-setup file remains inside `src/` or at the project root.
- [x] Source and tests import across folders through the `@` alias.
- [x] The full test suite runs and passes with the same tests as before.
- [x] The app builds and starts exactly as before, with no test code in the production bundle.
- [x] The project's typecheck, format, lint, build and test checks all pass.
