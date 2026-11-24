# Tasks

### Group 1: The backup file and the restore rules

Covers: the data constraints behind AC 1, 3 and 5. The screen is untouched, so the app stays exactly as it is while the rules land and are proven.

- [x] Define the backup file as one JSON file: an app marker, a version number (the data schema version, currently 3), the time it was made, and the rows of each table
- [x] Add a registry of the tables that are backed up, where each table says how its rows are checked when they come back in. Start with the mood entries, and add a test that fails if the database has any table that is missing from the registry, so a future module cannot forget to join the backup
- [x] Build a backup from the database by going through every registered table. Rows that cannot be read as valid entries are left out, and the result says how many were left out, so a backup can always be restored
- [x] Check an incoming file before anything is touched, without trusting it: it must be valid JSON, carry the app marker, have a whole-number version, and hold only known tables whose rows all pass their checks. Anything else is rejected with a clear reason in plain words, and nothing is changed
- [x] Reject a backup whose version is newer than the app understands, with its own plain-words reason ("made by a newer version of cebete")
- [x] Bring older versions up to date as they come in: version 2 files hold entries in the old single-emotion layout and go through the existing conversion, and version 1 files hold no data. Files older than that are rejected
- [x] Restore by replacing everything in one all-or-nothing step: clear every registered table and write the backup rows, ids included, in a single transaction, so a failure part-way leaves the previous data exactly as it was
- [x] Add tests: a backup holds every row with its version, the file round-trips (export, wipe, restore gives the same entries with the same ids, notes and times), not-JSON and wrong-marker and bad-version and bad-row files are rejected and change nothing, a newer version is rejected, a version 2 file is converted correctly, a damaged row is left out of an export and counted, and a restore that fails part-way (for example duplicate ids in the file) keeps the previous data
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 2: Export from Settings

Covers: AC 1.

- [x] Replace the Settings "coming soon" placeholder with a real Settings screen that has a Backup section, with a short, friendly explanation that the data lives only on this device and why a backup matters, and an Export button
- [x] On Export, build the backup and download it as one file named with the date (for example `cebete-backup-2026-11-24.json`), working fully offline
- [x] Say what happened in a calm message: how many entries were saved, and if any could not be read and were left out, say so; if the export fails, show a calm, muted message
- [x] Keep every control at least 48 px for touch, and keep the keyboard and screen reader flow working, including announcing the result politely
- [x] Remove the "coming soon" placeholder component if nothing uses it any more, and update the existing app tests that expected the Settings placeholder
- [x] Add tests: the Backup section is shown, Export downloads one file with the right name and content, the message reports the number of entries and any left out, a failed export shows the calm message, and nothing else on the device changes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 3: Import with a confirmation

Covers: AC 2, 3, 4, 5.

- [x] Add an Import control to the Backup section that lets the user pick a backup file
- [x] After a file is picked, check it first without changing anything. If it is invalid, damaged or from a newer version, show a calm message with the plain-words reason, and leave the data untouched
- [x] If the file is valid, show a confirmation that says what is in it (how many entries and when it was made), warns that everything currently on the device will be erased and replaced and cannot be undone, and suggests exporting first, with Cancel and a clearly named confirm choice
- [x] On confirm, replace the data in one all-or-nothing step and show a calm success message saying how many entries were restored; the Mood list updates by itself. On Cancel, nothing changes
- [x] If the replacement fails, show a calm message and make clear the previous data is kept
- [x] Look after keyboard and screen reader users: focus moves to the confirmation and its safe choice, comes back to the Import control after Cancel, the results are announced politely, and all controls are at least 48 px
- [x] Add tests: a valid file leads to the confirmation with its summary, Cancel changes nothing, confirming makes the data match the backup and shows the success message, a not-a-backup file, a damaged file and a newer-version file each show their own message and change nothing, a failed replacement keeps the previous data and says so, and picking the same file again works
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)

### Group 4: Verify in a real browser

Covers: AC 1 to 5, and the offline and all-or-nothing constraints.

- [x] Add entries through the screen, export, and confirm a real file is downloaded with the expected name and contents (version, every entry with its emotions, ratings, notes and times)
- [x] Wipe the data, import that file through the real file chooser, confirm, and check the Mood list matches what was backed up, including after a reload and after closing and reopening the browser
- [x] Check Cancel leaves the data unchanged, and that a text file, a corrupted backup and a backup marked as a newer version are each refused with their message and change nothing
- [x] Import a backup in the old version 2 layout and confirm its entries are converted and shown correctly
- [x] Check the replacement is all-or-nothing against the real database, using a backup that fails part-way, and confirm the previous data is intact
- [x] Check export and import both work with no network, and that the PWA is still installable and still opens offline
- [x] Review screenshots of the Backup section, the confirmation and the messages on a phone-sized window for the calm look, and measure the tap targets
- [x] Tick the matching acceptance criteria in `spec.md` once each truly passes
- [x] Run checks in order: typecheck → format → lint → build → test (all must pass)
