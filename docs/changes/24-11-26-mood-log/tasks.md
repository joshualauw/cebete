# Tasks

### Group 1: Mood entry data and storage

Covers: the data constraints (AC 5 at the storage level). The screen is untouched, so the app stays exactly as it is while the data layer lands.

- [x] Define the mood entry type and the preset list of emotions (a string-literal list, not an enum), with the emotion-plus-intensity part as its own small shape so later modules, such as the thought record, can reuse it unchanged
- [x] Extend the local database with a mood entries table as schema version 2, keeping version 1 declared so existing data upgrades cleanly, with entries ordered by the time they were recorded
- [x] Add the data operations: add an entry, list entries newest first, and delete an entry
- [x] Validate on add, whatever the screen does: the emotion must be on the list, intensity must be a whole number from 0 to 100, and the note is optional, trimmed, and limited in length. Reject invalid entries without saving anything
- [x] Set the time automatically when an entry is saved, so a caller can never supply or fake it
- [x] Update the existing database tests for version 2 and the new table, in place of the old "no tables" expectation
- [x] Add tests: add then list returns newest first, invalid emotion, intensity and note are rejected and nothing is saved, the time is set automatically, delete removes only that entry, entries survive closing and reopening the database, and a version 1 database upgrades to version 2 with no errors
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Mood list and empty state

Covers: AC 1, 6.

- [x] Add the Dexie React hooks package, so the list updates by itself whenever the stored data changes
- [x] Replace the Mood "coming soon" placeholder with the real Mood screen, keeping its "Mood" heading
- [x] Show the entries newest first, each with its emotion, intensity out of 100, note when there is one, and the time it was recorded
- [x] Show a short, friendly empty state inviting the user to add their first entry when there are none, and never flash it while the entries are still loading
- [x] Show a calm, muted message when the entries cannot be loaded, instead of a blank screen (the live-query hook throws on failure, which would otherwise take the whole app down)
- [x] Update the existing app tests that expected the placeholder
- [x] Add tests: entries appear newest first with all their details, the note only shows when present, the empty state appears with no entries but not while loading, the list updates when an entry is stored, and a load failure shows the calm message
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Add an entry

Covers: AC 2, 3.

- [x] Add a prominent "Add entry" action on the Mood screen that reveals the entry form
- [x] Build the form: an accessible single-choice picker for the emotion, an intensity slider from 0 to 100 that starts in the middle with its number always visible, and an optional short note with a visible length limit
- [x] Keep Save unavailable until an emotion is chosen, and keep every control large enough for comfortable touch use
- [x] On save, store the entry, close the form, and show the new entry at the top of the list straight away; Cancel closes the form and saves nothing
- [x] Show a calm, muted message if saving fails, and keep what the user typed
- [x] Add tests: Save is unavailable without an emotion, choosing an emotion and saving adds the entry at the top, the note is saved and shown, the intensity chosen is the intensity saved, Cancel saves nothing, and a failed save keeps the form open
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Delete an entry

Covers: AC 4.

- [x] Add a delete action to each entry, which asks for an inline confirmation before removing it, since deleting cannot be undone
- [x] Let the user back out of the confirmation, leaving the entry untouched
- [x] Show a calm, muted message if deleting fails, and keep the entry and the confirmation so the user can try again
- [x] Look after keyboard and screen reader users: move focus to the safe "Keep" choice when the confirmation opens, back to the Delete action when the user backs out, and to the list after a delete, with a spoken "Entry deleted" note saying how many are left
- [x] Add tests: deleting removes only the chosen entry and the list updates, backing out keeps it, deleting the last entry brings back the empty state, a failed delete keeps the entry, and the delete button's text is readable on its colour
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Verify in a real browser

Covers: AC 5, and a final pass over AC 1 to 4 and 6.

- [x] Check by hand in a real browser against a production preview: add several entries through the screen, with and without a note, and confirm the order, details, empty state and delete
- [x] Confirm the entries are still there after a reload and after closing and reopening the browser, and that adding, listing and deleting all work with no network
- [x] Confirm that a database created by the previous version of the app upgrades in place when the new version opens it, with no data loss and no errors
- [x] Review screenshots of the screen, the form and the empty state on a phone-sized window for the calm look, and measure the form's tap targets
- [x] Confirm the PWA is still installable and still opens offline
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
