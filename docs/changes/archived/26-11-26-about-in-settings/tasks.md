# Tasks

### Group 1: The app's own version

Covers: AC 2 (the version half). The app looks the same afterwards.

- [x] Set the version to `0.1.0` in `package.json` and in the matching lines of `package-lock.json`
- [x] Make the version in `package.json` available to the app as a build-time constant (Vite `define`, read from `package.json` in `vite.config.ts`), with a type declaration for it so it is typed and never `any`; the test runner picks it up from the same config
- [x] Tests: the constant equals the `package.json` version, and is a non-empty string
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The About section

Covers: AC 1, 2, 3, 4.

- [x] Add an `About` section component in a new `src/about/` folder, styled like the Backup card (same border, radius and padding) and labelled by its `h2` heading "About", so it is a named region for screen readers
- [x] Show the app name and its version (for example "cebete, version 0.1.0")
- [x] Add the privacy statement in calm, plain words: everything you record stays on this device, cebete sends nothing anywhere and has no analytics, and backup files are plain text, so keep them safe
- [x] Add the disclaimer: cebete is a self-help tool, and not a substitute for professional care or emergency help
- [x] Place the section on the Settings screen below Backup, leaving the Backup section untouched
- [x] Tests: Settings shows an About region after the Backup region; it shows the name and the version; it carries the privacy and the disclaimer statements; it contains no link; the existing Backup tests still pass unchanged; nothing is fetched on render
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
