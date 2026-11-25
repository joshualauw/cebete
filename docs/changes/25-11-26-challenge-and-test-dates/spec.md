---
title: Challenge and test dates
type: feat
priority: medium
status: todo
date: 2026-11-25
modules: [thoughts, backup]
synced: false
epic: first-release
---

## User Story

As someone challenging and testing my thoughts, I want to see when I did each one, so that I can follow my progress over time.

## Goal

A thought record only knows when the thought happened, not when it was challenged or tested. Recording those moments lets the app say when each was done, and lets later summaries place them in the right week.

## Scope

**In scope**
- The moment a challenge is saved, and the moment a test result is logged.
- Showing both on the record screen.

**Out of scope**
- Choosing a date by hand, backfilling old records, a history of revisions, and a date on a planned test.

Related work, now archived: `25-11-26-thought-record`, `25-11-26-challenge-thought` and `25-11-26-test-your-thinking`.

## Behavior

- **Challenge:** saving a challenge stamps the moment. Revising it stamps a new moment, so the latest save wins, which matches the belief now shown.
- **Test:** logging the result stamps the moment. Revising the result stamps a new one. Revising only the plan of a logged test keeps its result date. A planned test has no date.

The record screen shows "Challenged on" and the date in the Challenge part, and "Tested on" and the date in the Test part once a result is logged. Older records that were challenged or tested before this change simply show no date, and nothing else about them changes.

## Decisions

- The date is automatic, never chosen by the user, so there is nothing new to fill in.
- Latest save wins, to stay consistent with the belief the part shows.
- The date lives inside the same record, with no new table and no new database version. Backups include it, and older backups restore as before.
- Old records stay undated. Anything that needs a date for them, such as a summary, falls back to the time of the thought itself.

## Constraints and edge cases

- A date that is present but not a real moment makes that part damaged, like any other bad part: the record is left out of the list, never deleted, and a backup holding it is refused.
- No ordering rule against the thought's time, which the user can edit later.
- Editing the thought keeps its challenge and test dates as they are. Deleting the record deletes them.
- Dates are shown in the user's local format and time zone.
- A failed save keeps what was typed and stamps nothing.

## Acceptance Criteria

- [ ] When the user saves a challenge, the Challenge part shows "Challenged on" with today's date.
- [ ] When the user revises a challenge and saves, the date updates to that moment.
- [ ] When the user logs a test result, the Test part shows "Tested on" with today's date.
- [ ] When the user revises only the plan of a logged test, the "Tested on" date stays the same.
- [ ] When a test is only planned, no test date is shown.
- [ ] When the user opens a record challenged before this change, it shows no date and works as before.
- [ ] After a backup and restore, the dates remain.
