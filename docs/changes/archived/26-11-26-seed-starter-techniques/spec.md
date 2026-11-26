---
title: Seed the starter techniques
type: feat
priority: medium
status: done
date: 2026-11-26
modules: [coping, storage, backup]
synced: true
---

## User Story

As someone using the "Need to settle?" screen, I want the starter techniques to be my own library items, so that I can edit or delete them like my own items.

## Goal

The three built-in techniques cannot be changed or removed, and sit apart from the user's own items. As ordinary library items they give one list, one look and full control.

## Scope

**In scope**
- Slow breathing, grounding (5, 4, 3, 2, 1) and muscle relaxation are added to the coping library once, when the app's database is first created.
- The "Need to settle?" screen shows only library items.
- The backup reminder stops counting coping items.

**Out of scope**
- Upgrading existing databases, a fallback list, a "restore the starters" button, merging duplicates, seeding Mood or Thoughts, and a read-only example for Thoughts.

Related work, now archived: `25-11-26-coping-library` and `25-11-26-calm-now-on-home`. This reverses the latter's decision that the techniques are fixed.

## Behavior

A new database opens with three "Do" items: the technique's name as the short text, and its numbered steps as the detail. They are edited, deleted and ordered like any other item.

The settle screen shows library items only, in its four groups, in one style. The fixed block is gone. An empty library shows the gentle prompt to add items, and items that cannot be loaded show only the calm message.

The backup reminder looks only at mood entries and thought records, so a new user with just the starters is not nagged.

## Decisions

- A hard replace: there is no real usage yet, and the user is the only user.
- Seeded once when the database is created, not with a browser-storage flag, which can get out of step with the data.
- No fallback list: an unreadable database means the app is broken anyway.
- Mood and Thoughts are not seeded: their rows are the user's own data and would distort the Home summary and the reminder.

## Constraints and edge cases

- The seed runs exactly once per new database, with no schema version change. A deleted starter never comes back.
- Seeded rows are normal rows, in backups. A restore replaces the library with the backup's contents, so a backup without them restores without them.
- Each technique's steps fit the 500-character detail limit.
- The existing device needs a one-time reset (clear site data) or the items added by hand. The app does not handle this.
- Fresh test databases start with the three items, so tests assuming an empty library must clear it first.

## Risks and open questions

- An unreadable database leaves the settle screen with only a message.
- The reminder no longer covers a user with only a coping library.

## Acceptance Criteria

- [x] When the app starts with a new database, the library holds the three starter techniques.
- [x] When the user edits a starter, the change shows, and when they delete one, it stays deleted.
- [x] When the user opens "Need to settle?", only library items are shown, starters included, in one style.
- [x] When the library is empty, the screen invites adding items, and when items cannot load, it shows only a calm message.
- [x] When a new user has only the starters, Home shows no backup reminder.
- [x] When the user has mood entries or thought records and no recent backup, the reminder still appears.
- [x] After a backup and restore, the library is exactly what the backup held.
