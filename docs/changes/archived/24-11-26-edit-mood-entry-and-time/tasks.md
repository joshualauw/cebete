# Tasks

### Group 1: The rules and the saving of an edit

Covers: the data constraints behind AC 2, 3, 5 and 6. The screen is untouched, so the app stays exactly as it is while the rules land and are proven.

- [x] Add the shape of an edited entry: the same emotions and note as a new entry, plus the recorded time
- [x] Check an edited entry before anything is saved, with the same rules as adding (one to three emotions, none repeated, ratings 0 to 10, note up to 500 characters after trimming, a blank note left out), plus the time: it must be a real date and time and must not be in the future. A broken rule is explained in plain words
- [x] Add saving of an edit that replaces the stored entry as one step, keeping its id. A note that was cleared is removed, not kept. The time is kept exactly as it was unless the user changed it
- [x] If the entry no longer exists (for example it was deleted meanwhile), save nothing, create nothing, and report it with its own plain-words reason
- [x] Add tests: an edit changes the emotions, the ratings, the note and the time, and nothing else; the id is kept; a cleared note is removed; an unchanged time is kept to the millisecond; a rejected edit (no emotion, a repeated emotion, a rating out of range, a long note, a future time, an invalid time) changes nothing; editing a missing entry saves nothing and creates nothing; the list order follows an edited time; an edited entry is still valid for the backup and round-trips through export and restore
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The form in edit mode

Covers: AC 1, 2, 4, 5 at form level. The add flow is unchanged, and the edit form is not yet reachable from the list.

- [x] Let the existing entry form open in an edit mode for one given entry, pre-filled with its emotions, ratings and note, with the title "Edit entry"
- [x] In edit mode only, add a date and time field with a visible label, pre-filled with the entry's recorded time, that cannot be set in the future. If the user does not touch it, the original time is kept exactly
- [x] On Save, save the edit and close. On Cancel, close and change nothing. Explain a broken rule in plain words and keep what the user typed. If saving fails, show a calm message and keep everything typed; if the entry no longer exists, say so calmly and offer Cancel only
- [x] Keep the add form exactly as it is: no time field, the "New entry" title, and the stamp on save
- [x] Look after keyboard and screen reader users: focus moves into the form when it opens, the buttons are switched off while saving so a double tap saves once, and all controls are at least 48 px
- [x] Add tests: the form opens pre-filled with the entry's values, changing each part and saving updates the entry, Cancel changes nothing, an empty emotion choice cannot be saved, a future time is refused with a message and the entry stays unchanged, a failed save keeps what was typed and the stored entry, a deleted entry is reported and nothing is recreated, a double tap saves once, and the add form is unchanged
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Edit from the list

Covers: AC 1 to 4 and 6.

- [x] Add an Edit action to each entry, next to Delete, named after the entry's emotions and time for screen readers, at least 48 px tall
- [x] Choosing Edit shows the edit form in place of that entry, and the list updates by itself after saving, with the entry in its new place when its time changed
- [x] Only one form is open at a time. While the add form or another entry's edit form is open, the Edit actions are switched off, and Add entry is hidden as it already is, so no typed work is lost silently
- [x] When the form closes, focus returns to the entry's Edit action, wherever the entry now sits in the list, and a polite spoken note says the entry was updated
- [x] Add tests: each entry has an Edit action; choosing it opens the form pre-filled; saving shows the updated entry; changing the time moves the entry to its new place; Cancel leaves the entry unchanged; Edit actions are switched off while a form is open; focus returns and the update is announced; the edit survives a remount of the screen
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Verify in a real browser

Covers: AC 1 to 6, and the offline and backup constraints.

- [x] Add entries through the screen, edit each part (emotions, a rating, the note, and the time), and confirm the list shows the change each time
- [x] Change an entry's time to an earlier one and confirm it moves to its new place; try a future time and confirm it is refused with its message and nothing changes
- [x] Check Cancel leaves an entry unchanged, and that a cleared note disappears
- [x] Reload, and close and reopen the browser, and confirm the edits are still there
- [x] Export a backup after editing, wipe, import it, and confirm the edited entries come back as edited
- [x] Check editing works with no network
- [x] Review screenshots of the Edit action and the edit form on a phone-sized window for the calm look, including the date and time field, and measure the tap targets
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Saving a new entry with a chosen time

Covers: the data constraints behind AC 7 and 8. The screen is untouched, so the app stays exactly as it is while the rule changes and is proven.

- [x] Let a new entry be saved with a time the caller chooses. When no time is given, keep stamping it with the moment of saving, exactly as today
- [x] Check a chosen time with the same rules as an edit: a real date and time, not in the future. A broken rule is explained in plain words and nothing is saved
- [x] Update the existing test that says a caller can never supply the time, because that rule now changes: a chosen time is kept, and only an absent time is stamped automatically
- [x] Add tests: an entry saved with no time is stamped with the moment of saving; an entry saved with an earlier time keeps exactly that time; a future time, an invalid time and a time that is not a number are refused and save nothing; a back-dated entry takes the place its time gives it in the newest-first list; a back-dated entry is valid for the backup and round-trips through export and restore
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 6: The date and time picker in the add form

Covers: AC 7 and 8.

- [x] Show the date and time field in the add form too, with the same visible label, filled with the current moment, and with the same look and 48 px height as in the edit form
- [x] If the user leaves the field alone, save with no chosen time, so the entry is stamped with the exact moment of saving, even if the form was open for a while. If the user changes it, save with the time they chose
- [x] Explain a future or empty time in plain words, keep everything the user typed, and save nothing, as the edit form already does
- [x] Keep the rest of the add form exactly as it is: the "New entry" title, focus moving into the form, focus returning to Add entry, and the save and cancel behavior
- [x] Update the existing tests that expected the add form to have no date and time field
- [x] Add tests: the add form shows the field filled with the current moment; saving without touching it stamps the saving moment; saving with an earlier time keeps it, and the new entry appears in the place that time gives it in the list; a future time and an empty time are refused with a message, the form stays open with what was typed, and nothing is saved; a failed save keeps what was typed and the chosen time
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 7: Verify the picker in a real browser

Covers: AC 7 and 8, and the offline and backup constraints.

- [x] Open the add form and check the picker shows the current moment; add an entry without touching it and confirm the stored time is the moment of saving, to the millisecond range of a few seconds
- [x] Add an entry with an earlier date and time and confirm it is stored with exactly that time and appears in the place the time gives it in the list
- [x] Try a future time and an empty time in the add form and confirm each is refused with its message, the typed text stays, and nothing is saved
- [x] Reload, and close and reopen the browser, and confirm the back-dated entry is still in place
- [x] Export a backup that holds a back-dated entry, wipe, import it, and confirm the entry comes back with the same time
- [x] Check adding with a chosen time works with no network
- [x] Review screenshots of the add form with the picker on a phone-sized window for the calm look, and measure the tap targets
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
