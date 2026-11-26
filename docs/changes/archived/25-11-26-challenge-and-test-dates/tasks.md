# Tasks

### Group 1: Dates in the data

Covers: the rules behind AC 1 to 7 (a challenge date, a test result date, old records, backups). Nothing is shown on screen yet; the app runs as before.

- [x] Add an optional "challenged at" moment to the challenge and an optional "tested at" moment to a done test in `src/thoughts/types.ts`; a planned test has none
- [x] Teach validation about them: absent is fine (old records), present must be a real moment (a positive whole number), a bad one makes the part invalid like any other bad field, so the record is left out of the list and a backup holding it is refused; a planned test drops any date
- [x] Stamp in the repository, so the existing flows stay as they are: saving a challenge always stamps now (latest save wins); saving a done test stamps now when the test was not done before or its result or belief changed, and keeps the stored date when only the plan changed; planned tests get none
- [x] Check that editing the thought keeps both dates (including when the challenge's feelings follow the edited ones), and that deleting the record deletes them
- [x] Tests: validation (kept when valid, refused when bad, absent allowed, dropped from a planned test); repository (challenge stamped, revise restamps, first result stamped, revised result restamped, plan-only revision keeps the date, planned test has none, record edit keeps both, a gone record is not recreated); backup (a round trip keeps the dates, a bad date is refused, an older backup without dates restores and its records stay valid)
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Showing the dates on the record screen

Covers: AC 1, AC 2, AC 3, AC 4, AC 5, AC 6, AC 7.

- [x] Add a date-only formatter next to the existing time formatter in `src/mood/format.ts`, in the user's local format
- [x] Show "Challenged on <date>" in the Challenge part when the challenge has a date, and "Tested on <date>" in the Test part once a result is logged and dated; nothing for a planned test, and nothing for an undated old challenge or test
- [x] Tests on the record screen: saving a challenge shows today's date; revising updates it; logging a result shows "Tested on"; revising only the plan keeps the date; a planned test shows no date; an old challenge or test shows no date and still works; the dates survive a backup and restore
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
