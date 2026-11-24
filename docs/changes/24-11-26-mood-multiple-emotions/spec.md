---
title: Mood entries with several emotions and a 0 to 10 scale
type: feat
priority: medium
status: done
date: 2026-11-24
modules: [mood-log, storage]
synced: true
---

## User Story

As a person practising CBT, I want to record several feelings at once, each with its own 0 to 10 rating, so that an entry reflects my mixed emotions on a scale that is quick to use.

## Goal

Feelings rarely come alone, so an entry should hold more than one. A coarse 0 to 10 scale is also quicker to rate on a phone than 0 to 100.

## Scope

**In scope**
- Choosing one to three emotions in a single entry.
- A whole-number rating from 0 to 10 for each chosen emotion, replacing the single 0 to 100 intensity.
- Showing every emotion with its rating in the list.
- Bringing entries saved before this change onto the new shape.

**Out of scope**
- Editing a saved entry, trends and insights, linking entries to thoughts.
- Changing the list of emotions or the note.

Builds on `24-11-26-mood-log`, already delivered.

## Behavior

In the add form the user taps up to three emotions, and taps a chosen one again to remove it. Each chosen emotion gets its own 0 to 10 rating, labelled with its name and starting at 5. Save is available once at least one emotion is chosen. After three, the others cannot be added until one is removed, and a calm message says why.

A saved entry appears at the top of the list showing each emotion with its own rating, for example "Anxious 7/10" and "Hopeful 4/10", then the note and time. Everything else works as before: newest first, delete with confirmation, the empty state, and offline use.

## Decisions

- One rating per emotion. Rejected: one overall rating, which cannot show one feeling was stronger than another.
- Whole numbers from 0 to 10 replace 0 to 100.
- At most three emotions keeps the form short on a phone.
- Emotions keep the order the user chose them in.

## Constraints and edge cases

- An entry has one to three emotions, none repeated, each with a whole-number rating from 0 to 10. This is enforced when saving, whatever the screen does.
- The emotion-with-rating pair stays a small reusable shape for later modules, such as the thought record.
- Earlier entries must never be lost or break the list or the app. The upgrade happens by itself when the app opens.
- The stored data layout changes, so the backup ticket `24-11-26-data-export-import` must use the new shape.

## Risks and open questions

- How entries saved on the old 0 to 100 scale are reworked is left to planning with the seafarer. Recommended default: divide by 10 and round (92 becomes 9), keeping emotion, note and time, so an old entry becomes one with a single emotion. Please confirm at planning.

## Acceptance Criteria

- [x] When the user adds an entry, they can choose up to three emotions, and a fourth cannot be added.
- [x] When the user chooses an emotion, they can rate it from 0 to 10, separately from the others.
- [x] When no emotion is chosen, the user cannot save.
- [x] When the user saves, the entry appears at the top of the list with every chosen emotion and its rating out of 10.
- [x] When the user opens the mood log after the change, earlier entries are still there, in the new format.
- [x] Deleting an entry and using the log offline work as before.
