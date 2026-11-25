# Tasks

AC numbers refer to the acceptance criteria in `spec.md`, in order: 1 "Note body reactions" is offered, 2 picking areas and saving, 3 editing and saving with none, 4 the card line, 5 cancelling after a change, 6 reload and backup restore.

The body notes are an optional part of the same stored record, like the challenge and the test, so there is no new table and no new database version. The data is a list of areas from a fixed set, each with an optional description, in the fixed order of the set. Saving no areas removes the part, so a record with no notes has no body property at all.

Unlike the challenge and the test, this is not a step-by-step flow: it is one screen, so it gets its own small form with its own Cancel and discard question, not the step shell.

### Group 1: Body notes in the stored record

Covers: AC 6 (storage and backup).

- [x] Add the fixed set of body areas (head, throat and neck, chest, stomach, hands, legs, whole body) with their names, and the type of one note: an area and an optional description. Add the field to the record type and its name to the list of problems a record can report.
- [x] Add the rules: only areas from the set, each at most once, a description at most 500 characters after trimming, blank descriptions left out. The stored list comes out in the order of the set, whatever order it was given.
- [x] Make the check on a stored record include the notes when there are any, so damaged notes leave the row unreadable, as with a damaged challenge or test. This is also what backup uses to accept or refuse a row.
- [x] Add saving the notes of a record: an empty list removes them, nothing else in the record changes, and a record that is gone is never recreated.
- [x] Make editing the record keep its body notes, as it keeps its challenge and test.
- [x] Add tests: the rules and their messages, the order, a duplicate or unknown area or a long description being refused, damaged notes making the row unreadable, saving, replacing and clearing, the rest of the record unchanged, editing the record keeping its notes, a record that is gone, and backup export, restore and refusal of a file with damaged notes, plus an older backup without any.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The Body section on the record screen

Covers: AC 1, 2, 3, 5.

- [x] Add the form: one screen with a labelled group of the areas to switch on or off, each as a control of at least 48 px, and, for each chosen area, a field for its description labelled with the area, with its length shown. Cancel and Save below, a calm failure message that keeps what was typed, Save switched off while saving so a double tap saves once, and Save switched off until something has changed.
- [x] Give the form the discard question when something was changed, with Keep editing focused first, and a flow that says so and offers only Close when the record is gone.
- [x] Add the Body section to the record screen, below Test. With no notes it shows a short prompt and "Note body reactions". With notes it lists each area with its description, and offers "Edit".
- [x] Wire the form in place of the Body section as one more flow: one flow at a time with the other actions, "Body notes saved." announced politely, and focus returning to the button that opened it. Saving with no areas returns the section to its prompt.
- [x] Add tests: the offer, picking areas and describing some, the list shown after saving and stored on the same record, editing to add, change and remove areas, saving with none returning to the prompt, the fixed order, the limit of 500 characters, Save off until changed, the discard question with and without typing, a failed save keeping the text, a double tap saving once, a record deleted while the form is open, the other actions switched off during the form and its action switched off during theirs, and that the areas can all be reached and toggled by keyboard and have names for a screen reader.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: The card line

Covers: AC 4.

- [x] Add "Body noted", with its checkmark, to the completed parts of the card when the record has at least one area, after "Challenged" and "Tested" when they are there. No notes add nothing.
- [x] Add tests: a record with notes shows the line with a decorative checkmark and no other detail, a record with none shows nothing, all three lines show in order for a challenged, tested and noted record, and the card's link name includes the line.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Real-browser check

Covers: AC 1 to 6 end to end.

- [x] Build and preview on a port other than 4173 (the user's own preview). On a phone-sized window: open a record, note a few areas with descriptions, save, check the section and the card line, reload, edit and remove areas, clear them all, go offline and reload, and look at the screen and the card. Check the controls are comfortable to tap.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
