# Tasks

### Group 1: Project scaffold and quality tooling

Covers: AC 5. Gets the five checks running from day one, so every later group can be verified.

- [x] Scaffold a React + Vite + TypeScript project in the repo root, with TypeScript strict mode on
- [x] Add package scripts for `typecheck`, `format`, `lint`, `build` and `test`
- [x] Configure Prettier (config and ignore file)
- [x] Configure ESLint (flat config) with TypeScript, React hooks and accessibility rules, and the Prettier-conflict config so the two never fight
- [x] Configure Vitest with React Testing Library and a browser-like environment, plus a smoke test proving the setup works
- [x] Add a `.gitignore` for dependencies, build output and local files
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Minimal start screen

Covers: AC 1.

- [x] Replace the Vite template with a minimal screen showing the name "cebete", and set the page title to "cebete"
- [x] Remove the template's leftover assets and styles
- [x] Add a component test that the screen shows the name cebete
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Local database and persistent storage

Covers: AC 4 (the app keeps data on the device only).

- [x] Add Dexie and create the database module with a versioned schema (version 1, no tables yet) that later modules extend
- [x] Request persistent storage on first start, and carry on quietly when the browser refuses or does not support it
- [x] Add a fake IndexedDB to the test setup so the database can be tested without a real browser
- [x] Add tests: the database opens with the expected schema version, persistence is requested at startup, and a refused request does not break startup
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: App icon and identity assets

Covers: AC 2 (prerequisite: an installable app needs its icon).

- [x] Write a one-time development script that draws the cebete icon as a vector (SVG master) in the calm teal tone
- [x] Extend the script to render the PNG icons: 192, 512, a maskable 512, and an Apple touch icon, plus a favicon
- [x] Keep the script out of the app bundle, and document how to rerun it in the script's header
- [x] Run the script once and save the generated icons in the public assets folder
- [x] Reference the favicon and Apple touch icon from the page
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Installable offline PWA

Covers: AC 2, 3, 4.

- [x] Add the PWA plugin and configure the manifest: name and short name "cebete", icons including the maskable one, standalone display, start URL and theme colour
- [x] Configure the service worker to cache the app files so it opens offline after the first visit, with automatic updates
- [x] Add a test that checks the generated manifest has the required name, icons and display mode
- [x] Verify by hand against a production preview: the app is installable, opens offline after the first load, and makes no network calls for user data
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
