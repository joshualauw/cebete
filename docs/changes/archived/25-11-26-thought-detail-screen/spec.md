---
title: Thought detail screen
type: refactor
priority: high
status: done
date: 2026-11-25
modules: [thoughts, app-shell]
synced: true
epic: thought-record-detail
---

## User Story

As someone keeping thought records, I want a short list and a screen per record, so that I can read and act on one record calmly without a crowded card.

## Goal

A card holding everything is crowded, and more parts are coming. A short list plus one screen per record gives each part room.

## Scope

**In scope**
- List cards reduced to a summary.
- A screen per record, at its own address, with the record, its challenge, and Edit, Challenge, Revise and Delete.

**Out of scope**
- New record parts (tests, body reactions, worry level), which come in their own tickets.
- Any change to stored data, the capture flow, or backup.

Related (archived): `25-11-26-thought-record`, `25-11-26-challenge-thought`. A record now gets its own address.

## Behavior

**The list.** Each card shows the situation as a muted line, the thought, the date and time, and a line for each completed part of the record, such as "Challenged", with a checkmark on its left. A record with no completed part shows none. No belief rating is shown. The whole card opens the record, and it has no Edit, Delete or Challenge buttons.

**The record screen.** It has a back action and these parts:
- **The thought:** situation, feelings with ratings, what the user did, belief and time, with Edit.
- **Challenge:** a short prompt and "Challenge this thought", or, once challenged, the evidence, the balanced thought, and the belief and feelings before and now, with Revise.
- **Delete** at the bottom, with the same inline question as today.

Edit and Challenge open in place of their own part. "See the whole record" and "View challenge" are no longer needed. After a delete the user returns to the list and is told.

## Decisions

- Own address per record, so back, reload and offline use work. Rejected: expanding cards, which would regrow the list.
- Delete moves to the record screen only.
- The card shows progress, not ratings; the belief is read on the record screen. Later parts, such as a test, add their own completed line.

## Constraints and edge cases

- Existing flow rules stay: limits, discard question, calm failures, one flow at a time, 48 px controls.
- The checkmark is decoration only; the label carries the meaning.
- An address with no record shows a calm message and a way back. A record deleted while open is reported, not recreated.
- Focus moves to the screen's heading on opening, and returns to the card on coming back.
- Data, backups and older records are unchanged. Works offline.

## Acceptance Criteria

- [x] When the user opens Thoughts, each record appears as a short summary card with no action buttons.
- [x] When the user taps a card, the record opens on its own screen, and back returns to the list.
- [x] When the user edits a record on its screen and saves, the changes show there and in the list.
- [x] When the user challenges or revises a challenge, it shows on the screen with its before and after.
- [x] When the user deletes a record from its screen and confirms, they return to the list and it is gone.
- [x] When the user reloads on a record screen, or opens it offline, the same record shows.
- [x] Existing records, challenges and backups work as before.
- [x] When a record has been challenged, its card shows "Challenged" with a checkmark on its left and no belief rating; an unchallenged card shows no such line.
