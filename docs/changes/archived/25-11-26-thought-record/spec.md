---
title: Thought record
type: feat
priority: high
status: done
date: 2026-11-25
modules: [thoughts, app-shell, storage, backup]
synced: true
---

## User Story

As someone practising CBT on my own, I want to capture an upsetting situation and the thought behind it, so that I can look at my thoughts later instead of letting them run unnoticed.

## Goal

The mood log records feelings, not the thoughts behind them. A thought record is the core CBT exercise, and capturing it when upset must be short and calm.

## Scope

**In scope**
- A Thoughts section in the bottom bar, at its own address.
- A guided capture, one question per screen, with step markers to jump between steps.
- A list with Edit and Delete, like Mood, and backup support.

**Out of scope**
- Challenging a thought (next ticket `25-11-26-challenge-thought`, which depends on this one), a per-record address, body sensations, and mood links.

## Behavior

Thoughts sits after Mood in the bottom bar. A calm line says this is a self-help tracker, not professional care. Below are "New thought record" and the list, or an empty state.

The capture asks one question per screen, with Back, and Skip on optional steps: the situation (optional); feelings, up to three emotions rated 0 to 10 as in Mood; what the user did (optional); the thought; how strongly it is believed, 0 to 10; and when it happened, starting now.

Six numbered step markers above the question let the user jump to any step. The current one is highlighted, finished ones filled.

Saving closes the flow, and the record appears newest first. Each card shows the situation as a muted line, the thought, feelings, belief and date, with Edit and Delete as in Mood. Edit reopens the steps filled in, all reachable. Delete asks first and cannot be undone. Everything happens in place.

## Decisions

- Only the thought and one feeling are required.
- Our own step markers, not Chakra Steps (tab semantics, all panels mounted). The next ticket reuses them.

## Constraints and edge cases

- Text answers are at most 500 characters. A time must be real and not in the future.
- Markers go back freely, but forward only up to the first required step still empty (feelings, thought). A blocked marker is switched off, and the existing hint says why.
- Closing after typing asks before discarding, with markers hidden. Nothing is saved until the last step.
- A failed save shows a calm message and keeps typed text. A record deleted meanwhile is reported.
- Focus moves to the step heading on opening and after a jump, and returns to the opening control. Results are announced.
- Every control is at least 48 px tall, and six markers fit a 390 px phone, each named like "Step 2: Your feelings".
- Older backups without records still restore, leaving none. Backups stay unencrypted. Works offline.

## Acceptance Criteria

- [x] When the user opens Thoughts with no records, an empty state shows.
- [x] When the user starts a record, they are guided one question per screen and can skip optional ones.
- [x] When the thought or all feelings are missing, the record cannot be saved.
- [x] When the user saves, the record tops the list as a card with its parts.
- [x] When the user edits and saves, the card shows the changes.
- [x] When the user deletes a record and confirms, it is removed.
- [x] After a reload or a backup restore, the records remain.
- [x] When the user taps a step marker, they go to that step, unless an earlier required step is empty.
