# Tasks

### Group 1: Counting what happened in a range

Covers: the logic behind AC 2, AC 3 and AC 4. Pure code in the new `src/insights/` module; nothing is shown yet and the app runs as before.

- [x] Add the range rule: the last 7 or 30 days including today, counted by the user's local day (it starts at the beginning of the local day 6 or 29 days ago), as a small pure function that takes the current moment
- [x] Add the summary calculation: given the mood entries, the thought records, a range and the current moment, it returns how many of each fall in the range (placed by the time they happened) and the most frequent emotions, up to five, counting every emotion in an entry or a record once, most frequent first, with ties in the order of the emotion list so the order is stable
- [x] Add the wording of the header, "Last 7 days: 5 mood entries, 3 thought records", with correct singular and plural and a sensible line when one of the two is zero
- [x] Tests: the range at the start and end of a day, in a month change and across a clock change; 7 and 30 days; entries and records on the edge of the range, just outside it and (impossibly) later than now; counts of each kind; a record with three feelings adding to three emotions; entries and records adding to the same emotion; the top five cut-off; ties in a stable order; nothing in range; the header wording for 0, 1 and many
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The summary panel

Covers: AC 1 to AC 6 for the panel on its own. The panel is built and tested alone; it is not on Home yet.

- [x] Add a hook that reads the mood entries and thought records with the existing live-query hooks and reports one state: loading, ready with both lists, or error
- [x] Build the panel: a labelled region, the 7 / 30 day toggle as two real radio buttons styled as large chips (starting on 7 days, not remembered), the count header, and the most frequent emotions as simple horizontal bars drawn by the app, each row showing the emotion's name and its count as text, with the bar itself hidden from assistive technology and its length relative to the most frequent emotion
- [x] Show a kind "not enough yet" message when the range holds nothing, show nothing while the data is loading so it never flashes, and show a calm muted message if the data cannot be loaded
- [x] Keep the wording neutral: counts only, no judgement, no streaks
- [x] Tests: the panel starts on 7 days; the header and bars for a spread of data; switching to 30 days updates both; the empty message for an empty range and for an empty library; nothing while loading; the calm message on failure with the rest of Home unaffected; bars read as text (name and count) and never depend on colour; the panel updates by itself when an entry or record is added or removed; unreadable rows are left out
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: The panel on Home

Covers: AC 1 and AC 6 on Home itself, and the order of Home.

- [x] Place the panel on Home below the backup reminder (when shown) and above the coping library link, leaving the settle card first
- [x] Tests: Home shows the panel after the reminder and before the coping link; it starts on 7 days at every visit, also after the user chose 30 and came back; adding a mood entry from the app makes the panel update without reopening Home; the settle card, quick actions and reminder are unchanged
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
