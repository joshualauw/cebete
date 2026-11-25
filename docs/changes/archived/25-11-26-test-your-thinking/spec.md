---
title: Test your thinking
type: feat
priority: medium
status: done
date: 2026-11-25
modules: [thoughts, backup]
synced: true
depends_on: [25-11-26-thought-detail-screen]
epic: thought-record-detail
---

## User Story

As someone with a worrying thought, I want to plan a real-world test of it and record what happened, so that I can see with evidence whether it was true.

## Goal

Testing a thought in real life changes belief more than reasoning alone, and the prediction written first is what makes it work.

## Scope

**In scope**
- A Test part on the record screen, in two stages: plan now, log the result later.
- Showing the test and its outcome on the screen, and a completed test on the list card.

**Out of scope**
- Reminders and repeated tests with a history.

Depends on `25-11-26-thought-detail-screen` (archived).

## Behavior

A record without a test shows "Plan a test" in its Test part, opening a guided flow, one question per screen:
1. How and when could you test this thought? (required)
2. If the thought were true, what do you predict would happen? (required)

Saving shows the plan and prediction in the Test part, a calm "Test planned" label, and "Log the result". The card shows nothing yet, since it lists only completed parts.

Logging the result is a second guided flow:
1. What happened when you tested it? (required)
2. How strongly do you believe the thought now, 0 to 10? It starts at the original belief.

Saving shows the plan, prediction, result and belief before and now, and the card gains "Tested" with a checkmark, like "Challenged". Plan and result can be revised from the screen.

The thought stays visible above each flow. A challenge is not needed first, and a challenged record can also be tested.

## Decisions

- Two stages, because the real test happens between planning and logging. Rejected: one sitting like the challenge, which would just repeat it.
- One test per record, revised in place, like the challenge. Repeated tests are left for later.
- The card shows completed parts only, no beliefs; each part on the record screen shows its own belief before and now.

## Constraints and edge cases

- Each answer is at most 500 characters after trimming. A broken rule is explained and nothing is saved.
- Cancelling asks before discarding typed text. A failed save keeps the text, and a double tap saves once.
- A record deleted meanwhile is reported, not recreated; deleting a record deletes its test.
- The test is an optional part of the same record: older records and backups still work, and tests are backed up.
- Focus, announcements and controls follow the existing flows. Works offline.

## Risks and open questions

- Whether a planned test can be dropped before a result is logged is left for planning.
- A planned test is not on the card and could be forgotten; the Test part shows it.

## Acceptance Criteria

- [x] When a record has no test, its screen offers "Plan a test".
- [x] When the user saves a plan, the Test part shows "Test planned" and offers "Log the result", and the card shows nothing new.
- [x] When the user logs a result and a new belief, the screen shows the plan, prediction, result and belief before and now, and the card shows "Tested" with a checkmark.
- [x] When a record has a challenge and a test, each part shows its own belief before and now, and the card shows both lines.
- [x] When the user revises a plan or a result and saves, the changes show.
- [x] After a reload or a backup restore, the plans and results remain.
