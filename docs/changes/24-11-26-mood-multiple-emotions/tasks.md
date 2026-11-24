# Tasks

### Group 1: New entry shape, the 0 to 10 scale and the data upgrade

Covers: AC 4, 5, 6 (the display and the data), plus the data constraints. The app stays runnable: the list already shows the new format, and the form still picks a single emotion for now, but rates it 0 to 10 and saves it in the new shape. Group 2 replaces that stop-gap.

- [x] Change the scale to whole numbers from 0 to 10, starting at 5, and add the limit of three emotions per entry as one named setting
- [x] Change the entry shape to a list of one to three emotion-and-rating pairs, reusing the existing small pair shape, plus the optional note and the automatic time
- [x] Update the validation: one to three emotions, none repeated, each on the list, each rating a whole number from 0 to 10, the note rules unchanged, and a clear plain-words reason per problem. Nothing is saved when an entry is rejected
- [x] Update add, list and delete to the new shape, with the time still set automatically
- [x] Raise the database to schema version 3 and upgrade existing entries automatically the first time the app opens: each old entry keeps its id, note and time, becomes a one-emotion entry, and its 0 to 100 intensity is divided by 10 and rounded (the recommended default in the ticket)
- [x] Make the upgrade safe: it must never fail the whole database opening, so an odd or damaged old row is repaired as well as possible and never blocks the app, and running it again must not change entries that are already converted
- [x] Keep the current screen working: the list shows each emotion with its rating out of 10 (as in "Anxious 7/10"), and the existing single-choice form saves a one-emotion entry on the new scale
- [x] Update the existing tests that use the old shape or the 100 scale
- [x] Add tests: validation of the count, repeats, list membership, rating range and whole numbers, a saved entry in the new shape, and the upgrade from a version 2 database holding entries that cover 0, 4, 5, 50, 92 and 100, with and without notes, keeping ids, times and order. Also add tests that a damaged row does not stop the upgrade, that a second open changes nothing, and that a version 1 database upgrades straight to version 3
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Choosing several emotions, each with its own rating

Covers: AC 1, 2, 3, 4.

- [x] Turn the emotion picker into a multi-choice group: tapping an emotion chooses it, tapping a chosen one removes it, and the order chosen is kept
- [x] Enforce the limit of three in the picker: once three are chosen the others cannot be added until one is removed, and a calm, muted message explains why, announced politely to screen readers
- [x] Show a separate 0 to 10 rating for each chosen emotion, labelled with its name, starting at 5, with its number always visible; removing an emotion drops its rating, and choosing it again starts fresh at 5
- [x] Keep Save unavailable until at least one emotion is chosen, and save the emotions in the order chosen, each with its own rating
- [x] Show every emotion of an entry with its own rating in the list, and make the Delete action name all of them (for example "Delete the Anxious and Hopeful entry from…")
- [x] Keep every control at least 48 px for touch, and keep the keyboard and screen reader flow working (focus, labels, the group name)
- [x] Update the picker, form, list, delete and screen tests for several emotions
- [x] Add tests: choosing and removing, the fourth being blocked with its message, a rating per emotion that changes independently, ratings dropped when an emotion is removed, Save unavailable with none chosen, the saved entry carrying exactly what was chosen in order, a failed save keeping every choice, and a multi-emotion entry showing correctly in the list and in the delete flow
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Verify in a real browser

Covers: AC 5, 6, and a final pass over AC 1 to 4.

- [x] Create a database in the exact previous layout, holding several entries on the 0 to 100 scale (including a very low one, a middle one and a 100), then open the new build on it and confirm the entries are converted and shown correctly, with nothing lost and no errors
- [x] Add an entry with three emotions and different ratings, using the keyboard and a pointer, and confirm a fourth cannot be added, that removing an emotion and choosing it again resets its rating to 5, and that the entry shows at the top of the list with every emotion and rating
- [x] Confirm the entries survive a reload and a full browser restart, and that adding, listing and deleting work with no network
- [x] Review screenshots on a phone-sized window of the form with three ratings, the limit message and a list with multi-emotion entries, check the calm look, and measure the tap targets
- [x] Confirm the PWA is still installable and still opens offline
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
