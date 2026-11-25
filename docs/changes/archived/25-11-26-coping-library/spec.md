---
title: Personal coping library
type: feat
priority: medium
status: done
date: 2026-11-25
modules: [coping, storage, backup, app-shell]
synced: true
epic: coping
---

## User Story

As someone who gets overwhelmed by worry, I want to keep my own list of things that help me cope, so that I have them ready before a hard moment comes.

## Goal

Coping skills only help when they are to hand. A personal library, built while calm, gives the user one place for what works for them, and is the base for a quick way to settle later.

## Scope

**In scope**
- A Coping library screen, entered from Home, to add, edit and delete items grouped by type, saved on the device and in backups.

**Out of scope**
- The quick "settle now" screen and built-in techniques (`25-11-26-calm-now-on-home`, which depends on this ticket).
- Photos, extra fields per type, intensity or tags, and links from thoughts or body areas.

## Behavior

Home gains a link to "My coping library", which opens at its own address. Home stays highlighted in the bottom bar there; no new tab is added.

The library lists items in four groups, in this order: Do, Keep nearby, Tell myself, About me. Empty groups are left out. With no items, a friendly empty state invites the first one.

An item has a type, a short text (required) and an optional detail line:
- **Do:** something to do now, such as slow breathing; the detail can hold steps.
- **Keep nearby:** an object or place to reach for, such as a stuffed animal.
- **Tell myself:** calming words, such as "This will pass."
- **About me:** something true and positive about the user, such as "I'm a good listener", as evidence against a worry.

"Add an item" opens a form: pick a type, write the text, optionally add a detail, Save or Cancel. Edit opens the same form in place, filled in. Delete asks "Delete this item?" inside the item, with Keep focused first.

## Decisions

- One library replaces separate checklist, kit and positive-statement lists; it is the same data.
- Tell myself and About me stay separate: one soothes, the other argues back with facts.
- Text only, no photos, to keep backups light.
- No bottom tab yet; promote Coping later if it proves central.
- The CBT Toolbox book is a source of ideas only; nothing is copied.

## Constraints and edge cases

- Text is at most 100 characters and detail at most 500 after trimming; a blank detail is left out and a blank text is refused in plain words.
- Within a group, items keep the order they were added.
- One form or question at a time; a failed save or delete shows a calm message and keeps what was typed.
- An item deleted while its form is open is reported, not recreated. A damaged stored item is left out, never deleted.
- Older backups and databases still open with an empty library.
- Controls are at least 48 px tall. Works offline.

## Acceptance Criteria

- [x] When the user opens Home, a link opens the coping library, with Home still highlighted in the bottom bar.
- [x] When the library has no items, a friendly empty state invites the user to add one.
- [x] When the user picks a type, writes a text and saves, the item appears under its group.
- [x] When the user edits an item and saves, the changes show in place.
- [x] When the user deletes an item and confirms, it disappears.
- [x] When the user restores a backup, the library items come back.
