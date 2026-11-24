---
title: Edit mood entries and choose their time
type: feat
priority: high
status: done
date: 2026-11-24
modules: [mood-log]
synced: true
---

## User Story

As someone keeping a mood log, I want to edit a saved entry and to choose when a feeling happened, so that I can fix mistakes and log a feeling I forgot to record, without losing the entry.

## Goal

A wrong entry can only be deleted and re-added, losing its time, and every entry is stamped when saved. Editing and a choosable time keep the log accurate.

## Scope

**In scope**
- Edit every part of a saved entry: emotions, ratings, note, and date and time.
- A date and time picker in the add form.
- Reuse the add form for editing.

**Out of scope**
- An edit history or undo.

Related work (archived, not changed): `24-11-26-mood-log`, `24-11-26-mood-multiple-emotions`.

## Behavior

Each entry has an Edit action next to Delete. It opens the add form in place of the entry, pre-filled with its emotions, ratings, note and time. The user changes anything and saves, and the entry is updated in place. Cancel leaves it untouched.

The add form shows a date and time picker filled with the current moment. If the user leaves it alone, the entry is stamped with the moment it is saved. If they change it, the entry is saved with the time they chose.

Both forms follow the same rules as before. The list stays newest first by recorded time.

## Decisions

- Everything is editable, including the time, so a feeling logged late gets the time it was really felt.
- One form serves adding and editing.
- Rejected: a fixed time, as the user prefers to correct it.

## Constraints and edge cases

- A time must be real and cannot be in the future. A refused entry is explained in plain words and nothing is saved.
- An untouched time is kept exactly, not rounded to the minute.
- If saving fails, a calm message appears and what the user typed stays.
- Buttons are disabled while saving, so a double tap saves once. Only one form is open at a time.
- If the entry was deleted before the edit is saved, the user is told and nothing is recreated.
- Focus moves into the form on opening and back to where it came from on closing. Results are announced politely, and every control is at least 48 px tall.
- Edited and back-dated entries are backed up as before. Works fully offline.

## Acceptance Criteria

- [x] When the user chooses Edit on an entry, the form opens filled with that entry's emotions, ratings, note and recorded time.
- [x] When the user changes any of these and saves, the list shows the updated entry.
- [x] When the user changes the recorded time, the entry appears in its new position in the newest-first list.
- [x] When the user cancels, the entry is unchanged.
- [x] When the user enters something that breaks the rules, such as no emotion or a future time, the edit is refused with a clear message and the entry is unchanged.
- [x] After a reload, the edited entry still shows the saved changes.
- [x] When the user opens the add form, a date and time picker shows the current moment, and an entry saved without touching it carries the time it was saved.
- [x] When the user picks an earlier date and time in the add form and saves, the entry appears where that time places it in the list.
