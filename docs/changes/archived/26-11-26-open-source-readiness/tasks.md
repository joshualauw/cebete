# Tasks

### Group 1: The licence and the PDF guard

Covers: AC 4, 5. The app does not change.

- [x] Add a root `LICENSE` with the standard MIT text, "Copyright (c) 2026 Joshua William"
- [x] Add the book PDF (`CBT_Printed_Version.pdf`) to `.gitignore` under its own short heading, keeping the file's final newline; the PDF stays on disk and stops showing as untracked
- [x] Tests (Node environment, like the hosting config tests): the `LICENSE` is the MIT text and names Joshua William and 2026; `.gitignore` lists the PDF, and git reports it as ignored (checked with `git check-ignore`); `.gitignore` ends with a newline and still holds its earlier entries (`node_modules`, `dist`, `.env`, `.vercel`)
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The README

Covers: AC 1, 2, 3, 6.

- [x] Write the root `README.md` in plain words: what cebete is (mood log, thought records with challenge and test, coping library with the quick "settle now" screen, Home summary, backup); the privacy promise (everything stays in the browser, no analytics, backup files are plain text); a short note that it is a self-help tool and not medical advice
- [x] Add how to run it, checked against `package.json` scripts and the engines field: the Node version needed, install, start the dev server, build, preview, and the five checks in order (typecheck, format, lint, build, test)
- [x] Add a short note that the web address is the identity of the data, so a backup is exported before moving the app to another address
- [x] Add a "Licence" line naming MIT and the `LICENSE` file, using a relative link only
- [x] Keep the README free of any repository link or hosted-app link, and of personal data such as an email; it describes only what the app does today, matching `docs/specs/`
- [x] Tests: the README exists at the root and has a heading naming cebete; it contains the privacy promise, the self-help and not-medical-advice note, and the run steps with every script name it mentions present in `package.json`; it holds no `http://` or `https://` address and no email; it mentions the licence
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: The README banner

Covers: AC 7 (the banner). The app does not change, and the banner is never part of the build.

- [x] Add a one-time development script (`scripts/generate-banner.js`, like the icon generator: a tool, not part of the app, never imported by `src/`) that draws the banner as vector artwork and writes `assets/banner.svg` and `assets/banner.png` (a new `assets/` folder at the root, outside `public/`, so it is never shipped), with an `npm run banner` entry in `package.json`
- [x] Draw the banner: a wide band in the brand teal, with the logo on the left (the icon's open "c" ring and dot, with colours inverted so it stands out on the band: pale tile, teal ring) and the title "cebete" beside it, in the same rounded stroke style as the ring; no tagline. The lettering is drawn from shapes, with no `<text>` element and no font, so it looks the same everywhere. The PNG is rendered with `sharp` at twice the size, so it stays sharp on high-density screens
- [x] Replace the plain `# cebete` heading at the top of `README.md` with the banner, shown by a relative path to the PNG, with the alternative text "cebete" (an image, not a link, so the no-links rule still holds)
- [x] Tests (Node environment): the SVG and the PNG both exist; the SVG has no `<text>` element, no external address and no script; the PNG is a real PNG, of the size the script declares and with a wide banner shape; `README.md` starts with the banner image and its alternative text is "cebete"; the image path points at a file that exists; the README still holds no web address, repository link or hosted-app link; and `assets/` is not under `public/`, so the build does not ship it
- [x] Update the README tests that expected the plain `# cebete` heading, so they accept the banner as the title
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
