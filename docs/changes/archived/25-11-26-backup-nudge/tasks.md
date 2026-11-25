# Tasks

### Group 1: Remembering the last backup

Covers: AC 1, AC 2 (and the edge cases for blocked storage, failed export and restore). Nothing changes on Home yet.

- [x] Add a small device-preference store in `src/backup/` for the time of the last backup and for the "not now" snooze, kept in the browser's own storage: every read and write guarded (storage can be missing or blocked), stored values treated as unknown until checked, and a way for screens to follow changes
- [x] Add a hook that reports the last backup as one of three states: a time, never, or unknown (storage blocked)
- [x] Show "Last backup: <date>", "Never backed up" or "Last backup: unknown" in the Backup section of Settings, in the user's local date format
- [x] Record the time when an export succeeds, and only then; a failed export and a restore leave it as it was
- [x] Tests: the store with good, missing, garbage and blocked storage; the three Settings texts; the date updating on screen after an export; no date after a failed export; no date change after a restore
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: The reminder on Home

Covers: AC 3, AC 4, AC 5, AC 6.

- [x] Add the rule for when a reminder is due: the user has data, and the last backup is more than 14 days old or never made, and it is not snoozed; never due while the state is unknown
- [x] Add a live check for "has data" (any mood entry, thought record or coping item), reporting nothing until the first read finishes so the reminder never flashes
- [x] Build the calm one-line reminder with a "Back up now" link to Settings and a "Not now" button that snoozes it for 7 days and moves focus somewhere sensible, since its own button disappears
- [x] Place it on Home below the "Need to settle?" card and above the coping library link, shown only when due
- [x] Tests: due and not due at the 14-day boundary, never made with data, no data, recent backup, "Not now" hiding it and it returning after 7 days, blocked storage showing nothing, "Back up now" opening Settings, the reminder reacting to a new backup or new data, and the reminder being a quiet note rather than an alert (the 48 px size comes from the shared button style, which a layout-free test cannot measure)
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
