# Tasks

### Group 1: The challenge data, rules and saving

Covers: the data constraints behind AC 2 to 7. The screen is untouched, so the app stays exactly as it is while the rules land and are proven.

- [x] Add an optional challenge to a thought record, kept inside the same stored record: the evidence for and the evidence against (both optional), the balanced thought, the belief now (0 to 10), and the feelings now, which are the record's own emotions each re-rated 0 to 10. Records saved before this ticket have none and stay valid. No new database version is needed, because the table and its indexes do not change
- [x] Check a challenge before anything is saved, without trusting the input: the balanced thought is required, each text answer is at most 500 characters after trimming and a blank optional one is left out, the belief is a whole number from 0 to 10, and the re-rated feelings must be exactly the record's emotions, each from 0 to 10. A broken rule is explained in plain words and nothing is saved
- [x] Make reading a record check its challenge too, so a damaged challenge makes the whole row unreadable (left out of the list, reported once, never deleted) and a damaged challenge in a backup refuses the file like any other damaged row. Teach the backup nothing new: it already checks each row with the same record check
- [x] Add saving of a challenge for one record, for a first challenge and for a revision alike, as one step that changes nothing else in the record. If the record is gone, save nothing, create nothing and say so with the existing "no longer exists" reason
- [x] Keep the challenge when the rest of the record is edited. When the edited feelings differ, the re-rated feelings follow them: emotions that remain keep their rating, new emotions start at their rating in the record, and removed ones drop theirs
- [x] Add tests: a first challenge is saved and the rest of the record is untouched; a revision replaces it; each rule above refuses and changes nothing (no balanced thought, a too-long answer, a belief out of range, re-rated feelings that do not match the record's emotions, a rating out of range); blank optional answers are not stored; a missing record saves and creates nothing; editing the record keeps the challenge and reconciles the feelings (kept, added, removed); a record with a damaged challenge is left out of the list and counted as unreadable in a backup; deleting a record removes its challenge; a record with a challenge round-trips through export and restore; a backup made before this ticket, with records and no challenges, still restores
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: A shared step flow shell

Covers: no acceptance criterion by itself. It is a refactor that lets the challenge flow reuse everything the capture flow does, and changes no behavior. All existing tests must keep passing without being weakened.

- [x] Pull the parts the capture flow and the challenge flow both need out of the capture flow into one shell: the current step, the step markers and their forward rule, focus on the step heading after every change, the step line with Cancel, Back, Skip, Next and the final Save button with its hint, the discard question, the "record no longer exists" state, and the failure message. Each flow supplies its steps, its required checks, its content and its save
- [x] Switch the capture flow, for both a new record and an edit, over to the shell without changing what the user sees or any wording, address, label or focus behavior
- [x] Let the belief step take its own question and hint, so the same step can ask about the thought now, and keep its default wording for the capture
- [x] Add tests for the shell on its own, with a small two-step example: markers, the forward rule, Back and Next, the discard question and the gone state. Leave the existing capture and marker tests as they are
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Challenge a thought

Covers: AC 1, 2 and 5.

- [x] Show a full-width primary button, "Challenge this thought", on its own row above the date, Edit and Delete of a card that has no challenge, at least 48 px tall
- [x] Choosing it opens the challenge flow in place of the card, built on the shell, with five steps, one question per screen and the step markers: what speaks for the thought (optional), what speaks against it (optional), a more balanced thought (required), how strongly the thought is believed now (0 to 10, starting at the original rating), and how the user feels now (the record's own emotions, each re-rated, starting at their original ratings). The step line says "Challenge · Step n of 5"
- [x] Save on the last step. The card then shows the belief as "Belief 8 → 4" (with a spoken form such as "from 8 to 4 out of 10"), a calm "Challenged" label and the balanced thought, and the list updates by itself. Cancel closes the flow and leaves the record as it was, asking first when something was typed or changed. If saving fails, show a calm message and keep everything typed; a double tap saves once; if the record is gone, say so and offer only Close
- [x] Treat the challenge flow as one of the flows that cannot run at the same time as another: while it is open, New thought record and every other Edit and Challenge action are switched off, and they come back when it closes
- [x] Return focus to the card's primary button after closing, announce "Challenge saved." politely, and keep every control at least 48 px tall
- [x] Add tests: an unchallenged card shows the button and a challenged one does not show it yet; the flow opens with the five steps, the markers, the original ratings and the record's own emotions; the balanced thought is required and blocks Next and the later markers with its hint, while the evidence steps can be skipped; saving updates the card with the arrow, the label and the balanced thought; cancel and discard leave the record unchanged and ask only when something changed; a failed save keeps what was typed; a deleted record is reported and not recreated; one flow at a time; focus and the announcement
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: View and revise a challenge

Covers: AC 3, 4 and 6.

- [x] On a challenged card, make the primary button read "View challenge" and open the record in place: the situation, the thought, the evidence for and against, the balanced thought, and the before and after ratings of the belief and of each feeling, with a button to revise and a Close button, and nothing editable until the user chooses to revise
- [x] Choosing to revise opens the challenge flow filled with the saved challenge, starting at the first step with every step reachable, and saves over the old challenge. After closing either view or flow, focus returns to the card's primary button
- [x] Make editing a challenged record's feelings visible and correct on the card and in the view: kept feelings show their ratings from the challenge, new ones start at their original rating, and removed ones are gone, so the view never shows a rating for a feeling the record no longer has
- [x] Check deleting a challenged record removes it with its challenge, and that the card of a record whose challenge was revised shows the new arrow and balanced thought
- [x] Add tests: "View challenge" opens the read-only view with every part and the before and after ratings; Close changes nothing; revising pre-fills the flow, saves, and the view and card show the changes; cancelling a revision leaves the old challenge; editing the record's feelings reconciles the view as specified; deleting a challenged record removes it entirely; one flow at a time still holds for the view; focus returns and announcements are made
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 5: Verify in a real browser

Covers: AC 1 to 7, and the offline and backup constraints.

- [x] On a phone-sized window, check an unchallenged card shows the primary button above the date, Edit and Delete, and the card still fits without sideways scrolling
- [x] Complete a challenge through the screen: skip the evidence steps once and fill them once, check the balanced thought blocks Next and the later markers until it is written, jump with the markers, re-rate the belief and the feelings, save, and confirm the card shows the arrow, the label and the balanced thought and the stored row matches
- [x] Check "View challenge" shows every part and the before and after ratings, revise the challenge and confirm the change, and cancel a revision and a first challenge and confirm nothing changed
- [x] Edit the challenged record's feelings and confirm the challenge follows as specified; delete a challenged record and confirm it is gone with its challenge
- [x] Reload, and close and reopen the browser, and confirm the challenges are still there; export a backup, wipe the browser data, import it and confirm the challenges come back exactly; import a backup made before this ticket and confirm its records return with no challenges
- [x] Check challenging and revising work with no network by switching the page's network off and using the loaded app
- [x] Review screenshots of the card with and without a challenge, each challenge step, the view and the discard question on a phone-sized window for the calm look, and measure the tap targets. Start the preview server directly, stop it by its process id afterwards, run the script under a time limit, and confirm nothing is left running
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 6: Show the record while challenging

Covers: AC 8, and the view's "what you did" line. The challenge flow keeps working exactly as it does now, with the record shown above each step.

- [x] Add a record summary to the challenge flow, for a first challenge and for a revision, placed between the step markers and the step title so it shows on every step. Let the shared step flow shell take such a block and keep it in place from step to step without remounting it
- [x] The summary always shows the thought being challenged as one line. Below it, a "See the whole record" button, at least 48 px tall, shows the other five parts as they were captured: the situation, the feelings with their original ratings, what the user did, the belief, and when it happened. A part the record does not have, such as an empty situation or no "what I did", is left out
- [x] Make the button announce whether the summary is expanded, name the area it opens, and read "Hide the record" while it is open. Keep the open or closed choice in the challenge flow itself, so it stays open across steps and jumps, and after "Keep editing" brings the flow back from the discard question. The summary is hidden together with the markers during the discard question and in the "record no longer exists" state
- [x] Add "What you did" to the read-only "View challenge" screen, after the situation and the thought, only when the record has it. Do not add when it happened there
- [x] Keep the capture and edit flows exactly as they are, since they are changing the record rather than remembering it
- [x] Add tests: the thought shows as one line on every step of a first challenge and of a revision; the button starts collapsed and the other five parts are not shown; opening it shows the situation, the feelings with their original ratings, what the user did, the belief and when it happened; a record without a situation or without "what I did" shows no empty line for them; the button announces its expanded state and its label changes; it stays open when moving with Next, Back and the markers; it stays open after Keep editing; it is hidden during the discard question and the deleted-record state; the summary shows the original record, not the saved challenge, when revising; "View challenge" shows "What you did" when there is one and nothing when there is not, and never shows when it happened; the capture and edit flows show no such summary
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 7: Verify the record summary in a real browser

Covers: AC 8, and the phone layout and tap-target constraints.

- [x] On a phone-sized window, start a challenge and check the thought shows as one line above the first step, the other parts are hidden, and the button is at least 48 px tall and sits inside the card without sideways scrolling
- [x] Open the whole record and check all five parts match what was captured, including the original feelings and ratings, then move with Next, Back and the markers through all five steps and confirm it stays open and the thought stays visible
- [x] Check it also works when revising an existing challenge, shows the original record and not the challenge, and that closing with a discard question and choosing Keep editing brings the flow back with the summary still open
- [x] Check "View challenge" shows "What you did" and does not show when it happened, for a record that has it and for one that does not
- [x] Review screenshots of the collapsed and the open summary, on a first step and on the feelings step, on a phone-sized window for the calm look and for how much room the question keeps, and measure the tap targets. Start the preview server directly, stop it by its process id afterwards, run the script under a time limit, and confirm nothing is left running
- [x] Tick the matching acceptance criterion in `spec.md` once it truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
