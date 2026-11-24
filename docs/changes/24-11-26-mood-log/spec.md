---
title: Mood log
type: feat
priority: medium
status: done
date: 2026-11-24
modules: [mood-log]
synced: true
---

## User Story

As a person practising CBT, I want to record how I feel and how strongly, so that I can see my emotions over time and later link them to my thoughts.

## Goal

Deliver the smallest useful CBT module. It is immediately usable, and its emotion-plus-intensity shape is reused by later modules such as the thought record.

## Scope

**In scope**
- Create a mood entry: an emotion, an intensity from 0 to 100, an optional short note, and the time it was recorded.
- List all entries, newest first.
- Delete an entry.

**Out of scope**
- Editing an entry after it is saved.
- Trends, charts and insights.
- Linking entries to thoughts or activities.
- Export and import (separate ticket).

Depends on `24-11-26-app-foundation` and `24-11-26-app-shell-design`.

## Behavior

The user opens the mood log section and sees their past entries, newest first, each showing the emotion, intensity, note and time. A prominent action lets them add a new entry: they choose an emotion, set the intensity on a 0 to 100 scale, optionally type a note, and save. The new entry appears at the top of the list immediately. The user can delete an entry they no longer want. Entries persist on the device across restarts and work fully offline.

When there are no entries, the section shows a short empty state inviting the user to add the first one.

## Decisions

- Intensity uses a 0 to 100 scale, matching the rating used in standard CBT thought records.
- Entries are append and delete only. Editing is deliberately left out to keep the module small.

## Constraints and edge cases

- An entry cannot be saved without an emotion and an intensity.
- Intensity is always a whole number from 0 to 100.
- The timestamp is set automatically when the entry is saved.
- Deleting an entry cannot be undone.
- The entry shape must be reusable by later modules without a data migration.
- The mood entries are included in export and import once that ticket exists.

## Risks and open questions

- Emotion input is not yet decided: a preset list of common emotions or free text. Default to a preset list, which keeps later trends consistent. Please confirm.

## Acceptance Criteria

- [x] When the user opens the mood log, past entries are shown newest first.
- [x] When the user adds an entry with an emotion and intensity, it appears at the top of the list.
- [x] When the user adds an optional note, it is shown with the entry.
- [x] When the user deletes an entry, it disappears from the list.
- [x] When the user closes and reopens the app, including offline, their entries are still there.
- [x] When there are no entries, an empty state invites the user to add one.
