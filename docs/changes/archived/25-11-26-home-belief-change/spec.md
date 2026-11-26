---
title: Home belief change
type: feat
priority: medium
status: done
date: 2026-11-25
modules: [insights, thoughts]
synced: true
depends_on: [25-11-26-home-summary, 25-11-26-challenge-and-test-dates]
epic: first-release
---

## User Story

As someone challenging and testing my thoughts, I want to see how strongly I believed them before and after, so that I can tell whether the method is working for me.

## Goal

The point of challenging or testing a thought is to loosen its grip. Showing the belief before and after, for the chosen period, closes that loop without the user digging through records.

## Scope

**In scope**
- A belief-change block in the Home summary panel, using its 7 / 30 day toggle.

**Out of scope**
- Body areas, links from a pair to its record, a separate Insights screen, and any wording that judges progress.

Depends on `25-11-26-home-summary` for the panel and toggle, and on `25-11-26-challenge-and-test-dates` for the dates.

## Behavior

Below the most frequent emotions, the panel shows two blocks, "Challenged thoughts" and "Tested thoughts". They are kept apart because the methods differ.

Each block shows how many thoughts fall in the chosen range, and:
- **Three or more:** the average belief, written "Average belief: from 7.5 to 4", rounded to one decimal.
- **Fewer than three:** each thought's text with its belief written "from 8 to 4", not an average, because a small sample would mislead.
- **None:** a calm line such as "None in the last 7 days."

A challenge compares the record's original belief with the belief after the challenge. A test compares it with the belief after the result was logged. A record that was both challenged and tested appears in both blocks. Planned tests that have no result are not counted.

## Decisions

- Wording is neutral. If a belief went up, it says "from 4 to 6" in the same plain way.
- The range uses the challenge date or the test date. A record without one, because it was done before dates existed, falls back to the time of the thought itself, which is usually close.

## Constraints and edge cases

- The blocks follow the toggle and update by themselves as records change.
- Unreadable records are left out.
- Counts use correct singular and plural.
- Each block has a text reading that a screen reader can follow, and nothing relies on colour alone.
- The look stays calm and works offline.

## Acceptance Criteria

- [x] When the user has challenged thoughts in the range, "Challenged thoughts" shows their count.
- [x] When three or more are in the range, the average belief from before to after is shown.
- [x] When fewer than three are in the range, each thought is listed with its belief before and after.
- [x] When the user has tested thoughts with a result in the range, "Tested thoughts" shows them the same way.
- [x] When the user switches between 7 and 30 days, both blocks update.
- [x] When a belief went up, it is shown as plainly as a drop.
- [x] When nothing falls in the range, each block says so calmly.
