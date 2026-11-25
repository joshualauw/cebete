---
title: Body reactions on a thought
type: feat
priority: low
status: done
date: 2026-11-25
modules: [thoughts, backup]
synced: true
depends_on: [25-11-26-thought-detail-screen]
epic: thought-record-detail
---

## User Story

As someone who feels worry in my body, I want to note where and how my body reacts to a thought, so that I can see the link between thoughts and physical signs.

## Goal

Worry shows up in the body as well as the mind. Picking where it is felt, with a word or two each, is quick and helps the user spot those signs early.

## Scope

**In scope**
- A Body section on the record screen: body areas the user picks, each with an optional short description, added, edited and removed there.
- A "Body noted" line on the list card.

**Out of scope**
- A step in the capture flow, a tappable body diagram (a later ticket, as another way to pick the same areas), sensation chips, patterns over time, and before and after coping.

Depends on `25-11-26-thought-detail-screen` (archived). This reverses the earlier decision that body sensations are out of scope.

## Behavior

A record with no body areas shows a short prompt and "Note body reactions" in its Body section, below Test. It opens a one-screen flow in place of the section: a list of areas to switch on or off (head, throat and neck, chest, stomach, hands, legs, whole body). Each chosen area shows a field for an optional short description, such as "tight" or "racing". Save keeps them and Cancel closes.

Once saved, the section lists each area with its description, and "Edit" can add, change or remove areas. Saving with no areas returns the section to its prompt.

The list card gains "Body noted", with a checkmark on its left like "Challenged" and "Tested", once an area is saved, and nothing before. The capture flow stays as it is.

## Decisions

- Structured areas, not one text field: in the moment people will not type, may lack the words, and a list can later be counted.
- An own section, not a field in The thought, since it has its own list and actions.
- The data is a list of areas, each with an optional description, so a diagram can later be only another way to pick them.

## Constraints and edge cases

- Each area appears at most once, from the fixed list. A description is at most 500 characters after trimming, and may be blank.
- No drawing: the list works by keyboard and screen reader.
- Cancelling after a change asks before discarding. A failed save keeps what was typed, and a double tap saves once.
- A record deleted meanwhile is reported, not recreated; deleting a record deletes its notes.
- An optional part of the same record: older records and backups still work, and notes are backed up.
- One flow at a time. Focus, announcements and controls follow the existing flows. Works offline.

## Acceptance Criteria

- [x] When a record has no body areas, its screen offers "Note body reactions".
- [x] When the user picks areas, describes some, and saves, the Body section lists them.
- [x] When the user edits the areas or descriptions and saves, the changes show; saving with none returns the section to its prompt.
- [x] When a record has a body area, its card shows "Body noted" with a checkmark on its left; with none, no such line.
- [x] When the user cancels after a change, they are asked before discarding, and the record stays as it was.
- [x] After a reload or a backup restore, the body notes remain.
