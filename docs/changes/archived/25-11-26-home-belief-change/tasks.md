# Tasks

### Group 1: Working out the belief change

Covers: the logic behind AC 1 to AC 7. Pure code in `src/insights/`; nothing is shown yet and the app runs as before.

- [x] Add the calculation in `src/insights/`: given the thought records, a range and the current moment, it finds the challenged thoughts and the tested thoughts separately. A challenge counts with the belief before (the record's own) and after (the challenge's belief), a test only once its result is logged, with the belief before and after the test; a planned test counts for nothing, and a record with both a challenge and a test appears in both
- [x] Place each by its own date: the challenge date or the test date, falling back to the time of the thought itself when there is none (a part saved before dates existed); a part is in the range when that moment is on or after the start of the range, using the same range rule as the rest of the summary
- [x] For each kind return the count, each thought's text with its before and after, newest first (ties in a stable order), and, only when there are three or more, the average before and the average after rounded to one decimal
- [x] Add the wording: "3 thoughts in the last 7 days" with the singular for one, "None in the last 7 days.", "Average belief: from 7.5 to 4" (a whole number shown without a decimal), and "from 8 to 4", all neutral whether the belief went down, stayed or went up
- [x] Tests: challenge and test counted separately; a planned test left out; a record with both appearing in both; range by the challenge date, by the test date, and by the thought's time for undated parts, including an old thought challenged today and a recent thought with an old challenge; the edges of the range; exactly two and exactly three thoughts; averages and their rounding, including .25 and whole numbers; a belief that went up or stayed the same; newest first with a stable tie; damaged records ignored since they never reach this code; wording for 0, 1 and many
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The belief-change blocks in the summary panel

Covers: AC 1 to AC 7, in the panel and on Home.

- [x] Build the two blocks, "Challenged thoughts" and "Tested thoughts", each a labelled section under the most frequent emotions: the count line, then the average when there are three or more, otherwise each thought's text (kept to a couple of lines) with "from X to Y", or the calm "None in the last 7 days." line
- [x] Put them in the existing panel so they follow the same 7 / 30 day toggle and update by themselves as records change, and show them even when the emotions part says "not enough yet", since a thought from before the range can have been challenged inside it
- [x] Keep the wording neutral and readable by a screen reader, with nothing relying on colour
- [x] Tests: each block with 0, 1, 2 and 3 or more thoughts; the average and the list; switching between 7 and 30 days updating both blocks; a belief that went up shown as plainly as one that dropped; an old thought challenged inside the range; undated old parts falling back to the thought's time; planned tests not counted; updating live when a challenge is saved or a result is logged; the blocks inside Home below the emotions; the existing panel tests still pass
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
