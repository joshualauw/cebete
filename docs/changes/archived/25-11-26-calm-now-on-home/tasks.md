# Tasks

### Group 1: The quick-use screen with built-in techniques

Covers: AC 4, AC 5, AC 6. The screen can be opened by its address; Home does not link to it yet, and the user's own items are not shown yet.

- [x] Add the built-in techniques as fixed data in `src/coping/`: slow breathing, grounding and muscle relaxation, each with a title and short plain steps, written fresh (no book wording)
- [x] Add the `/settle` address and its route, and make the bottom bar keep Home current there (extend the hosted-addresses rule in `src/navigation/current.ts`)
- [x] Build the quick-use screen: a "Back to home" link, a calm heading, the built-in techniques with their steps under "Do", a gentle prompt to add personal items while the library is empty, a link "Edit my coping library", and the calm note that cebete is a self-help tool and not a substitute for professional care or emergency help
- [x] Tests: the techniques are complete and distinct; the screen shows each technique with its steps and the calm note with an empty library; the library link opens the coping library; the address works and keeps Home current in the bar; the screen needs no typing (the 48 px size is set by the shared button style, which a layout-free test cannot measure)
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The user's own items on the screen

Covers: AC 3 (and the edge cases for changes, loading and failure).

- [x] Read the user's items with the existing live-query hook and show them in four groups: Do (the built-in techniques first, then the user's own actions, with their detail as steps), Keep nearby (with detail), Tell myself (in larger text), and Remember (the About me items); groups with nothing are left out
- [x] Keep the built-in techniques on screen while the items are loading, without flashing the "add personal items" prompt, and show them with a calm muted message if the items cannot be loaded
- [x] Show the "add personal items" prompt only once the items have loaded and there are none
- [x] Tests: each kind appears in its group in the right order, the built-in techniques come before the user's actions, About me is labelled Remember, changes to the library show without reopening the screen, a damaged item is left out, the loading and failure states keep the techniques, and nothing on the screen can be edited
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: The calm card on Home

Covers: AC 1, AC 2.

- [x] Add the calm "Need to settle?" card on Home, a single link with a short muted line under it, opening the quick-use screen; no alarm colours, at least 48 px tall
- [x] Tests: Home shows the card with the right link; tapping it from the app opens the quick-use screen and Home stays highlighted in the bar; Back returns to Home
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
