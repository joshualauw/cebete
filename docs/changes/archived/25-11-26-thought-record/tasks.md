# Tasks

### Group 1: The thought record data, rules and storage

Covers: the data constraints behind AC 3, 4, 5 and 6. The screen is untouched, so the app stays exactly as it is while the rules land and are proven.

- [x] Define a thought record: an id, an optional situation, one to three emotions with 0 to 10 ratings (the same emotion-and-rating shape as Mood), an optional "what I did", the automatic thought, a belief rating from 0 to 10, and the time it happened. Define the limits: text answers at most 500 characters, belief a whole number from 0 to 10
- [x] Check a record before anything is saved, without trusting the input: the thought and at least one feeling are required, the emotions follow the Mood rules (no repeats, from the list), blank optional answers are left out instead of saved as empty text, and the time must be a real moment that is not in the future. A broken rule is explained in plain words and nothing is saved
- [x] Add a new database version with a table for thought records, listed by time, and raise the schema version. Existing mood entries and databases made by older versions must open and upgrade unchanged
- [x] Add reading and writing of records: add one, edit one (keeping its id, removing an answer that was cleared, and keeping an untouched time exactly), list them newest first with ties in save order, and delete one. An edit for a record that is gone saves nothing, creates nothing and says so with its own reason. A stored row that cannot be read as a record is left out of the list without being deleted and is reported once per page load, as Mood does
- [x] Add the thought records table to the backup registry, starting at the new data version, with its label ("thought record"), no conversion of older rows, and the record check. The registry test fails for any table that is not listed, so this must land together with the table
- [x] Add tests: a record round-trips with all its fields and its exact time; the same rules as Mood apply to the emotions; a missing thought, no feelings, a repeated emotion, a rating or belief out of range, a too-long answer, a future time and an invalid time are each refused and change nothing; blank optional answers are not stored; an edit changes only what was edited and keeps the id; a cleared answer is removed; editing a missing record saves and creates nothing; the list is newest first; a damaged row is left out and reported once; a database made by version 3 upgrades with its mood entries intact and an empty thought table
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Thought records in backup and restore

Covers: the backup constraints behind AC 7. The screen is untouched.

- [x] Make the backup messages mention thought records too, for example "Backup saved with 3 mood entries and 2 thought records", and say nothing for a table with no rows
- [x] Make sure a backup made before this version, which holds no thought records, still restores, and that the restore leaves the device with no thought records, as the spec says. Make sure a file whose thought records are damaged is refused like any other damaged file, and a file claiming a newer version is still refused
- [x] Update the existing backup and database tests that assumed a single table or version 3, without weakening them
- [x] Add tests: export includes thought records; the file round-trips (export, wipe, restore gives the same records, ids and times); a version 3 backup restores with no thought records and its mood entries intact; a damaged thought record refuses the whole file and changes nothing; the registry guard still fails for an unregistered table; the summary text names both kinds of rows
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: The Thoughts section, the list and Delete

Covers: AC 1 and 6, and the display part of AC 4.

- [x] Add a Thoughts item to the bottom bar after Mood, with its own address, a fitting icon and the same look as the other items. Add its route, so reloading the address works, and update the tests that expect exactly three sections
- [x] Add the Thoughts screen: a heading, a short calm line saying this is a self-help tracker and not a substitute for professional care, and the list below it. Show nothing while the first read is under way, a friendly empty state when there are no records, and a calm muted message if the records cannot be loaded. The list updates by itself when the stored data changes
- [x] Show each record as a card in the newest-first list: the situation as a small muted line if there is one, the thought in the user's words as the main text, the feelings with their ratings, the belief, and the date and time
- [x] Add Delete to each card, asking "Delete this record? This cannot be undone." inside the card with Keep and Yes, delete, as Mood does: Keep focused first, calm message and the question kept if it fails, polite announcement and focus kept in the list afterwards
- [x] Look after touch, keyboard and screen readers: every control at least 48 px tall, the card's actions named after the record, calm muted colours, and nothing wider than a 390 px phone
- [x] Add tests: the bottom bar shows four items and Thoughts opens its section; the address works on reload; the empty state, the loading state and the load-failure message; a seeded record shows all its parts, and one without a situation shows none; newest first; Delete asks first, Keep changes nothing, confirming removes the record and announces it; a failed delete keeps the record and the question
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: The guided capture

Covers: AC 2, 3 and 4.

- [x] Add a full-width "New thought record" button that opens the guided capture in place of the button, above the list
- [x] Build the steps, one question per screen, with a clear "Step 2 of 6" orientation: the situation (optional), the feelings using the existing emotion picker and 0 to 10 sliders, what I did (optional), the automatic thought, how strongly I believe it (0 to 10, starting at 5), and when it happened (a date and time field starting at the current moment). Back is on every step but the first, Skip is on the optional steps, and Next is switched off until a required step is complete
- [x] Save on the last step: an untouched time is stamped with the exact moment of saving, a changed time is kept, and a future or empty time is explained in plain words with everything typed kept. On success the flow closes and the new record is at the top of the list. If saving fails, show a calm message and keep everything typed; switch the buttons off while saving so a double tap saves once
- [x] Closing the flow after something was typed or chosen asks first ("Discard this record?" with Keep editing and Yes, discard, the safe choice focused); closing an untouched flow just closes. Nothing is saved before the last step
- [x] Look after keyboard and screen reader users: focus moves to the step's heading on each step and into the flow when it opens, comes back to the "New thought record" button when it closes, results are announced politely, and every control is at least 48 px tall
- [x] Add tests: the flow opens and the steps come one at a time with their orientation; Skip works only on optional steps; Back keeps what was typed; the thought and one feeling are required, so the flow cannot be completed without them; saving puts the record at the top of the list with everything entered; an untouched time is the moment of saving and a chosen time is kept; a future or empty time is refused and typed text stays; a failed save keeps everything and the flow open; discard asks only when something was typed; a double tap saves once; focus moves and returns as described
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Edit a record

Covers: AC 5.

- [x] Add an Edit action to each card next to Delete, named after the record, at least 48 px tall
- [x] Choosing Edit opens the same guided steps in place of that card, filled with the record's values and starting at the first step, with the time field showing the record's time. An untouched time is kept exactly; a changed one is validated like a new record. Saving updates the card, which moves to its new place if its time changed
- [x] Only one flow is open at a time: while the capture or another record's edit is open, the Edit actions and "New thought record" are switched off, so no typed work is lost silently. Closing after changes asks before discarding, as in the capture
- [x] If the record was deleted before the edit is saved, say so calmly, create nothing, and offer only a way to close. Return focus to the card's Edit action after closing, and announce "Record updated." politely
- [x] Add tests: Edit opens the steps filled with the record; changing any part and saving shows the updated card; a changed time moves the card; Cancel and discard leave the record unchanged; a cleared optional answer disappears from the card; a future time is refused; Edit and New are switched off while a flow is open; a deleted record is reported and not recreated; focus and announcements as described
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 6: Verify in a real browser

Covers: AC 1 to 7, and the offline and backup constraints.

- [x] Check the bottom bar shows Thoughts after Mood on a phone-sized window, opens its section with the calm line and the empty state, and still opens after a reload on its own address
- [x] Capture a record through the screen, step by step: Skip on the optional steps, the required steps blocking Next, Back keeping what was typed, then Save, and confirm the card at the top shows the situation, thought, feelings, belief and time, and that the stored row matches
- [x] Check a future time and an empty time are refused with their messages, the typed text stays, and nothing is saved; check closing after typing asks before discarding and Keep editing returns to the same step
- [x] Edit a record, including its time (it should move in the list), and clear an optional answer; delete a record through the inline question; confirm the stored rows match each time
- [x] Reload, and close and reopen the browser, and confirm the records are still there
- [x] Export a backup, wipe the browser data, import it, and confirm the records come back exactly; import a backup made before this version and confirm its mood entries return and no thought records remain
- [x] Check capturing and editing work with no network, and that the PWA is still installable and opens offline
- [x] Review screenshots of the Thoughts list, the card, each capture step, the discard question and the messages on a phone-sized window for the calm look, and measure the tap targets
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 7: The step markers

Covers: AC 8. The capture and edit flows keep working exactly as they do now, with the markers added on top of the existing step state.

- [x] Add a row of six numbered step markers above the step title, in both the capture and the edit flow. Each marker is a button named like "Step 2: Your feelings", the current one is marked as the current step for assistive technology and highlighted, and the finished ones are filled. Use a plain list of buttons, not a tab list, and do not use Chakra Steps
- [x] Work out which steps can be reached: going back is always allowed; going forward is allowed only up to and including the first required step that is still incomplete (the feelings, the thought), judged from what is typed right now, so clearing the feelings blocks the later markers again. In an edit, every step is reachable while its required steps are filled. A step counts as finished once the user has been past it, or always in an edit, and only while it is valid
- [x] Switch a blocked marker off so it does not navigate, and give it an accessible description that says what is needed first, in the same words as the existing hint ("Choose how you felt to continue", "Write your thought to continue"). The existing Next hint is unchanged
- [x] Jumping to a marker changes the step without losing anything typed or chosen, and moves focus to the step heading, as Back and Next already do. Back and Next stay and keep working alongside the markers
- [x] Hide the markers while the discard question is open and in the "record no longer exists" state, and show them again when the user keeps editing
- [x] Make the markers at least 48 px wide and tall, with a calm look in the existing teal palette, and make all six fit side by side inside the card on a 390 px phone without sideways scrolling. If six 48 px markers cannot fit with their gaps, stop and report instead of shrinking them
- [x] Add tests: six markers with their names appear in capture and in edit; the current one is marked and the others are not; going back to any earlier step works; in a capture, markers after the feelings are switched off until a feeling is chosen, and markers after the thought are switched off until a thought is written; clearing the feelings switches them off again; a switched-off marker does nothing when tapped and describes what is needed; in an edit every marker works at once; a jump keeps typed text, chosen feelings and ratings and the belief; focus lands on the new step's heading; the markers are hidden during the discard question and the deleted-record state and come back after Keep editing; saving still works after jumping from the first step straight to the last in an edit
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 8: Verify the markers in a real browser

Covers: AC 8, and the phone layout and tap-target constraints.

- [x] On a phone-sized window, open a new record and check six markers sit in one row inside the card with no sideways scrolling, each at least 48 px wide and tall, with the current one highlighted
- [x] In a capture, check the markers after the feelings are switched off until a feeling is chosen, then the markers after the thought are switched off until a thought is written, and that tapping a switched-off marker changes nothing; check a jump back to an earlier step keeps what was typed and chosen, and focus lands on the step heading
- [x] In an edit, jump straight from the first step to the thought step with one tap, change the thought, save, and confirm the stored record changed and nothing else did
- [x] Check the markers disappear while the discard question is open and return after Keep editing
- [x] Review screenshots of the markers in the first step, a blocked state, a finished state and an edit on a phone-sized window for the calm look, and measure the tap targets. Start the preview server directly and stop it by its process id afterwards, run the script under a time limit, and confirm nothing is left running
- [x] Tick the matching acceptance criterion in `spec.md` once it truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
