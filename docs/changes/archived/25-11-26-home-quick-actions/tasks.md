# Tasks

### Group 1: The "open the form" request, and the Mood side

Covers: AC 2, AC 4 and AC 5 for Mood. Nothing on Home changes yet; the Mood section is opened by hand as before.

- [x] Add a small shared request in `src/navigation/` that travels in the navigation history entry: a way to build it and a way to read it from an unknown value, in the same style as the existing Thoughts list note
- [x] Teach `src/screens/MoodScreen.tsx` to start with the new-entry form open when the request is there, reading it once when the screen appears, and to clear it from the history entry (replacing it, so Back still goes to Home and a reload does not reopen the form)
- [x] Extend the test render helper so a test can start at an address with a history note
- [x] Tests: the helper reads valid and garbage values; Mood opens with the form open, focus in the form, and the list below it; the form opens while the list is still loading and when it cannot load; Cancel closes the form, leaves the user on Mood and returns focus to "Add entry"; the note is cleared after use; opening Mood without the request shows no form; saving works as usual
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The Thoughts side

Covers: AC 3, AC 4 and AC 5 for Thoughts.

- [x] Teach `src/screens/ThoughtsScreen.tsx` to start with the guided capture open when the request is there, reading it once and clearing it the same way, without disturbing the notes the list already keeps in the same history entry (after a delete, and the record the user came back from)
- [x] Tests: Thoughts opens on step 1 of the capture with focus in it and the list below; it opens while the list loads or cannot load; Cancel closes the capture, leaves the user on Thoughts and returns focus to "New thought record"; the note is cleared after use; opening Thoughts without the request shows no capture; the list's own notes still work (coming back from a record, and the message after a delete)
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: The quick actions on Home

Covers: AC 1, and AC 2 to AC 5 through the whole app.

- [x] Add "Log how I feel" and "Write down a thought" to Home as two large links, directly below the "Need to settle?" card and above the backup reminder, each sending the request to `/mood` and `/thoughts`; calm look, at least 48 px tall, with the same icons the bottom bar uses
- [x] Tests: Home shows both below the settle card and above the reminder and the coping link; tapping each opens the right section with its form ready and the bar highlighting that section; Cancel keeps the user in the section with its list; Back returns to Home; reloading (opening the address again) does not reopen the form
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
