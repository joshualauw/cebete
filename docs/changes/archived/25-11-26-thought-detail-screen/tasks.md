# Tasks

AC numbers refer to the acceptance criteria in `spec.md`, in order: 1 summary cards, 2 tap opens the record, 3 edit, 4 challenge and revise, 5 delete, 6 reload and offline, 7 nothing existing breaks.

The new record screen is built next to the old list behaviour first, then the list is switched over and the old code removed, so the app runs after every group.

### Group 1: Address and single-record access

Covers: AC 6 (partly).

- [x] Add the record address (`/thoughts/:id`) to the navigation paths, with a helper that builds it from an id.
- [x] Add a single-record read to the thoughts storage code and a live-query hook for one record, with states for loading, ready, missing (no such id, or an unreadable row) and error. An unreadable row is reported the same way as in the list.
- [x] Keep Thoughts highlighted in the bottom bar on a record address, while Home still counts as current only on Home.
- [x] Check that the service worker fallback already covers the new address, and extend the PWA settings test to say so.
- [x] Add tests: the hook's states, the path helper, the bottom bar on a record address, the PWA settings.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The record screen, read-only

Covers: AC 2 (the screen), 6.

- [x] Add the record screen with a back action to the list and a heading that takes focus on opening.
- [x] Add The thought part: situation, feelings with ratings, what the user did, belief and time, leaving out parts the record does not have.
- [x] Add the Challenge part, read-only: the prompt when there is none; the evidence, balanced thought and before and now ratings when there is one. Reuse the existing before-and-now display.
- [x] Route `/thoughts/:id` to it in the app, with a calm message and a way back for an address that has no record, and a calm error state.
- [x] Add tests: each part shown and left out correctly, challenge shown, missing record, back action, focus on the heading, reload on the address in a memory router.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Edit and challenge on the record screen

Covers: AC 3, 4.

- [x] Add Edit to The thought part: the existing edit flow opens in place of that part, with the same steps, discard question and failure messages, and returns focus to Edit.
- [x] Add "Challenge this thought" and Revise to the Challenge part: the existing challenge flow opens in place of that part, with the thought still visible above it as one line.
- [x] Keep one flow at a time: while one is open, the other actions are switched off.
- [x] Announce "Record updated." and "Challenge saved." politely, and report a record deleted meanwhile with a calm notice, nothing recreated.
- [x] Add tests: edit saved and shown, edit cancelled with and without typing, challenge saved and revised, one flow at a time, record deleted while a flow is open.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Delete from the record screen

Covers: AC 5.

- [x] Add Delete at the bottom of the screen with the existing inline question ("Delete this record? This cannot be undone.", Keep focused first) and failure message.
- [x] After a successful delete, return to the list and have it announce "Record deleted." with how many records are left, with focus on the list.
- [x] Deleting a record still deletes its challenge.
- [x] Add tests: confirm and keep, failure keeps the screen, the return to the list with its announcement, the challenge going with the record.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Switch the list to summary cards

Covers: AC 1, 2, 7.

- [x] Rebuild the list card as a summary: situation as a muted line, the thought, a calm "Challenged" label, the belief ("9 → 4" with its spoken form once challenged), and the date and time. The whole card opens the record and has an accessible name that includes the thought and time.
- [x] Remove Edit, Delete and Challenge from the card, and the list's in-place flows, challenge view and editing lock. The New thought record button keeps working.
- [x] Return focus to the opened card when the user comes back from a record.
- [x] Remove the now unused record toggle and the challenge reading view, and show only the one-line thought above the challenge flow.
- [x] Update the existing list, card, challenge and summary tests to the new structure, without skipping or deleting any behaviour that still exists, and add tests for the summary card and its opening.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 6: Real-browser check

Covers: AC 6, 7.

- [x] Build and preview on a port other than 4173 (the user's own preview). Check on a phone-sized window: open a record, use the back button, reload on a record address, go offline and reload again, delete a record. Confirm that existing records and challenges look right.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 7: Completed parts on the summary card

Covers: AC 8. AC 1 and 7 must keep passing.

- [x] Remove the belief row, the "9 → 4" arrow and its spoken form from the list card.
- [x] Show one line per completed part of the record below the thought: today "Challenged", with a checkmark icon on its left. A record with no completed part shows no such line. Build it so a later part (such as a test) can add its own line without reworking the card.
- [x] Keep the checkmark decorative for assistive technology, so the label alone carries the meaning, and keep the whole card one link whose name still includes the thought and the time.
- [x] Update the list tests: no belief row or arrow on any card, the checkmark with "Challenged" on a challenged card, nothing for an unchallenged one, and the other tests that read the belief off a card (challenge flow, revision, edit) now read it from the record screen.
- [x] Look at the list on a phone-sized window in a real browser (port other than 4173), with one challenged and one plain record, and check the card still looks calm and short.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
