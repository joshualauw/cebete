# Tasks

AC numbers refer to the acceptance criteria in `spec.md`, in order: 1 "Plan a test" is offered, 2 saving a plan, 3 logging a result, 4 a record with both a challenge and a test, 5 revising, 6 reload and backup restore.

The test is an optional part of the same stored record, like the challenge, so there is no new table and no new database version. It is modelled as two states, planned and done, so a half-filled test cannot exist.

### Group 1: The test in the stored record

Covers: AC 6 (storage and backup).

- [x] Add the test to the record type as a planned state (how and when, prediction) or a done state (the same, plus the result and the belief now), and add its field names to the list of problems a record can report.
- [x] Add the rules: how and when, prediction and result are required, each at most 500 characters after trimming; the belief now is a whole number from 0 to 10.
- [x] Make the check on a stored record include the test when there is one, so a damaged test leaves the row unreadable, as with a damaged challenge. This is also what backup uses to accept or refuse a row.
- [x] Add saving a test to a record, whether first plan, revised plan, result or revised result, that changes nothing else and never recreates a record that is gone.
- [x] Make editing the record keep its test, as it keeps its challenge. The test has no feelings to follow.
- [x] Add tests: the rules and their messages, a damaged test making the row unreadable, saving each state, a revised plan on a done test keeping its result, editing the record keeping its test, a record that is gone, and backup export, restore and refusal of a file with a damaged test, plus an older backup without tests.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Planning a test on the record screen

Covers: AC 1, 2 (the screen), 5 (revising a plan).

- [x] Move the one-line thought shown above the challenge steps into a small shared piece, and use it in the challenge flow unchanged.
- [x] Add the plan flow, two steps with the usual shell: how and when to test (required), then the prediction (required). Given a test it opens filled, for revising.
- [x] Add the Test part to the record screen, below Challenge. With no test it offers a short prompt and "Plan a test". With a planned test it shows the plan, the prediction and a calm "Test planned" label, and offers "Revise the plan".
- [x] Wire the flow into the screen as one more flow that opens in place of the Test part: one flow at a time with Edit, Challenge and Delete, announce "Test planned." politely, and return focus to the button that opened it.
- [x] Add tests: the offer, both steps and their required hints, saving and showing the plan, the plan stored on the same record, revising, the discard question, a failed save keeping the text, a double tap saving once, a record deleted while the flow is open, the other actions switched off during the flow and the Test part's action switched off during theirs, and the limit of 500 characters.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Logging the result

Covers: AC 3 (the screen), 4 (the screen), 5.

- [x] Add the result flow, two steps: what happened (required), then the belief now from 0 to 10, starting at the original belief. Given a done test it opens filled, for revising.
- [x] Show "Log the result" on a planned test. A done test shows the plan, the prediction, the result and the belief before and now, using the same before-and-now display as the challenge, with "Revise the plan" and "Revise the result".
- [x] Wire it as another flow in place of the Test part, with the same one-flow-at-a-time rule, a polite "Test result saved." announcement, and focus returning to the button that opened it.
- [x] Add tests: the two steps, the belief starting at the original rating, saving and showing the result with before and now, a revised result and a revised plan on a done test keeping the rest, cancelling with and without typing, a failed save, a double tap, a record with both a challenge and a test showing each part's own belief, no challenge being needed first, and deleting a record deleting its test.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: The test on the card

Covers: AC 2 (the card shows nothing new), 3 (the card), 4 (the card).

- [x] Add "Tested", with its checkmark, to the completed parts of the card when the test is done, after "Challenged" when both are there. A planned test adds nothing.
- [x] Add tests: a planned test leaves the card as it was, a done test shows "Tested" with a decorative checkmark and no belief, both lines show in order for a challenged and tested record, and the card's link name includes the line.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Removing a plan

Covers: the open question in `spec.md` (a planned test can be dropped before a result is logged). No acceptance criterion changes.

- [x] Add removing the test from a record, for a planned test only, never recreating a record that is gone. A done test can only be revised.
- [x] Offer "Remove the plan" on a planned test, behind a short inline question like the one for Delete, with Keep focused first, a calm failure message and one flow at a time. Announce "Plan removed." politely.
- [x] Add tests: the question and Keep, removing and the Test part returning to its prompt, a failed removal keeping the plan, no such action on a done test, and the other actions switched off while the question is open.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 6: Real-browser check

Covers: AC 1 to 6 end to end.

- [x] Build and preview on a port other than 4173 (the user's own preview). On a phone-sized window: plan a test, check the card shows nothing new, reload, log the result, check the card shows "Tested" with its checkmark, revise, go offline and reload, and look at the screen and the card.
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
