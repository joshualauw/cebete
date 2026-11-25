---
title: Challenge a thought
type: feat
priority: high
status: done
date: 2026-11-25
modules: [thoughts, backup]
synced: true
---

## User Story

As someone who captured an upsetting thought, I want to test whether it is really true, so that I can replace it with a more balanced one and see my belief and feelings change.

## Goal

Challenging a thought later, when calmer, loosens its grip, and seeing the belief drop shows it works.

## Scope

**In scope**
- A "Challenge this thought" action on a saved record.
- Evidence for and against, a balanced thought, and re-rated belief and feelings.
- A before and after view on the card and in the record.
- Showing the record while the user answers.

**Out of scope**
- Real-world experiments, repeated challenges with a history, body sensations, and reminders.

Depends on `25-11-26-thought-record`.

## Behavior

An unchallenged card shows a full-width primary button, "Challenge this thought", above the date, Edit and Delete. It opens a guided flow in place, one question per screen, with Back:
1. What speaks for this thought? (optional)
2. What speaks against it? (optional)
3. A more balanced thought.
4. How strongly the original thought is believed now, 0 to 10.
5. How the user feels now: the record's emotions, each re-rated 0 to 10.

Steps 4 and 5 start at the original ratings. Throughout, the thought stays visible as one line. A "See the whole record" button shows the other five parts: the situation, feelings with ratings, what the user did, the belief, and when it happened. It stays open across steps.

Saving closes the flow and updates the card: "Belief 8 → 4", a calm "Challenged" label, and the balanced thought. The button becomes "View challenge", which opens the record in place showing the situation, thought, what the user did, evidence, balanced thought, and before and after ratings. The user can revise it from there.

## Decisions

- The challenge is the second stage of the same record.
- Editing a challenged record's feelings keeps the after-ratings of remaining emotions, new ones start at their before-rating, and removed ones drop theirs.
- The thought is always visible and the rest expandable. Rejected: all six parts on every step (too tall on a phone) and a fully collapsed line (it hides the thought).

## Constraints and edge cases

- The balanced thought is required. Each answer is at most 500 characters.
- Cancelling leaves the record as it was, and asks before discarding typed text.
- A failed save shows a calm message and keeps typed text. A double tap saves once.
- A record deleted meanwhile is reported, not recreated. Deleting a record deletes its challenge.
- Focus returns to the card's primary button, and results are announced. Every control is at least 48 px tall, and the record button says whether it is expanded.
- Challenges are in backups. Older backups and earlier records still work. Works offline.

## Acceptance Criteria

- [x] When a record has no challenge, its card shows a prominent "Challenge this thought" button.
- [x] When the user saves a challenge, the card shows the belief before and after, a "Challenged" label and the balanced thought.
- [x] When a record is challenged, "View challenge" shows the evidence, balanced thought and before and after ratings.
- [x] When the user revises a challenge and saves, the changes show.
- [x] When the user cancels, the record is unchanged.
- [x] When a record is deleted, its challenge goes too.
- [x] After a reload or a backup restore, the challenges remain.
- [x] While challenging, the thought stays visible, and one tap shows the whole record.
