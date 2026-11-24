# Tasks

### Group 1: Chakra UI and the calm teal theme

Covers: AC 5 (the theme part). The app gets its look first, so the screens and the bar built next are styled from the start. The start screen keeps its "cebete" heading.

- [x] Add Chakra UI and its styling engine as dependencies
- [x] Define the theme in one central place: a soft teal palette as the main colour, light neutral surfaces, softly dark text instead of pure black, generous spacing and rounded corners
- [x] Define muted warning and error colours in the theme, so nothing defaults to an alarming red
- [x] Keep the app light only: no dark mode, and the browser's dark preference must not change the look
- [x] Wrap the app in the Chakra provider with this theme, and restyle the start screen's heading with it
- [x] Add a test helper under `tests/` that renders components inside the theme provider, plus any browser stand-ins Chakra needs in the test environment
- [x] Add tests: the theme exposes the teal palette and the muted warning and error colours, and the key text and background colour pairs (body text, button text on teal, active bar item) meet a readable contrast ratio
- [x] Update the start screen test to render through the helper
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Sections, screens and addresses

Covers: AC 1, 4. The app can be used by address alone, with no bar yet, and stays runnable.

- [x] Add a router dependency, and define three sections with their own addresses: Home, Mood and Settings
- [x] Build the Home screen: the "cebete" heading and a short, friendly welcome message
- [x] Build simple "coming soon" placeholder screens for Mood and Settings
- [x] Send any unknown address to Home, so a mistyped address never shows an empty page
- [x] Make the sections part of the address, so a reload or the browser's back button keeps the user on the same section
- [x] Add tests: the Home screen shows the welcome message, each address shows its own screen, an unknown address ends up on Home, and opening the app directly on a section address shows that section
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Bottom navigation bar

Covers: AC 2, 3.

- [x] Add an icon library dependency for the bar's icons
- [x] Build the bottom bar with Home, Mood and Settings, each with an icon and a text label, fixed at the bottom of the screen on every section
- [x] Highlight the current section, and tell assistive technology which item is current
- [x] Make tap targets large enough for comfortable touch use
- [x] Keep the bar clear of the phone's notch and home indicator, and keep screen content from hiding behind the bar
- [x] Give the bar a proper navigation landmark with a label
- [x] Add tests: the bar shows all three items on every section, the current section is marked, tapping an item opens that section, and the bar has an accessible name
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Verify in a real browser

Covers: AC 4, 5, and a final pass over AC 1 to 3.

- [x] Confirm the offline service worker also serves the section addresses, so a reload on Mood or Settings works with no network
- [x] Check by hand in a real browser against a production preview, on a phone-sized and a desktop-sized window: take screenshots and review the calm teal look and that the layout is tidy at both sizes
- [x] Check by hand: reloading on a section keeps it, back and forward move between sections, and the bar is always visible
- [x] Measure the bar's tap targets in the browser, and confirm the PWA is still installable and still opens offline
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
