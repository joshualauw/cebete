---
title: Data export and import
type: feat
priority: high
status: todo
date: 2026-11-24
modules: [backup, storage]
synced: false
---

## User Story

As a person tracking my mental health privately, I want to back up my data to a file and restore it later, so that I do not lose it if my browser data is cleared or I change devices.

## Goal

Because all data lives only in the browser, a backup file is the user's only safeguard. This ticket provides a simple manual backup and restore.

## Scope

**In scope**
- Export all stored data to a single file the user downloads.
- Import such a file, replacing the data currently on the device after the user confirms.

**Out of scope**
- Merging imported data with existing data.
- Automatic or scheduled backups, and "last backup" reminders.
- Cloud storage or sync.

Depends on `24-11-26-app-foundation`, `24-11-26-app-shell-design` and `24-11-26-mood-log`.

## Behavior

From the Settings section, the user chooses export and receives one file containing everything stored in the app, labelled with a schema version. To restore, the user chooses import and picks a backup file. The app warns that the current data will be erased and replaced, and asks for confirmation. After confirming, the app's data matches the backup exactly, and the user sees that the import succeeded. If they cancel, nothing changes.

## Decisions

- Single file with a schema version number, so future changes can migrate old backups.
- Import replaces existing data, after a confirmation.
- Rejected: merge on import. It creates duplicates and conflicts that are not worth handling in a personal app.

## Constraints and edge cases

- A file that is not a valid backup, or is corrupted, is rejected with a clear message, and existing data stays untouched.
- A backup from a newer schema version than the app understands is rejected the same way.
- A backup from an older schema version is migrated on import.
- The replacement is all-or-nothing: if it fails midway, the previous data is kept.
- Every future module that stores data must be included in export and import.
- Export and import work offline.

## Risks and open questions

- Backups are plain, unencrypted files containing sensitive data. Users must store them carefully. Encryption is out of scope for now.

## Acceptance Criteria

- [ ] When the user chooses export, a single backup file containing all their data is downloaded.
- [ ] When the user picks a valid backup file to import, the app warns that current data will be replaced and asks to confirm.
- [ ] When the user confirms, their data matches the backup and a success message is shown.
- [ ] When the user cancels the import, their data is unchanged.
- [ ] When the user picks an invalid file, an error is shown and their data is unchanged.
