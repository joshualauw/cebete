---
title: Home summary
type: feat
priority: medium
status: todo
date: 2026-11-25
modules: [insights, app-shell, mood-log, thoughts]
synced: false
epic: first-release
---

## User Story

As someone logging my feelings and thoughts, I want a short summary on Home, so that I can see what has been going on lately without reading every entry.

## Goal

Entries pile up in lists. A compact summary shows what has been happening over the last week or month, in plain numbers, and starts a new `insights` module that later summaries can join.

## Scope

**In scope**
- A summary panel on Home, with a 7 / 30 day toggle.
- A count header and the most frequent emotions.

**Out of scope**
- Belief change (`25-11-26-home-belief-change`), body areas, a separate Insights screen, a charting library, streaks, and a single "mood line".

## Behavior

The panel sits below the backup reminder (when shown) and above the coping library link. The settle card stays first on Home.

- **Toggle:** "7 days" and "30 days". It starts on 7 days at every visit and is not remembered.
- **Header:** a line such as "Last 7 days: 5 mood entries, 3 thought records", with correct singular and plural.
- **Most frequent emotions:** up to five emotions, as simple horizontal bars, most frequent first, each with its name and count. Every emotion in a mood entry or a thought record counts once, so a record with three feelings adds to three emotions.
- **Not enough yet:** when the range holds no entries or records, a kind message says to log a few to see patterns, instead of an empty chart.

The panel follows the data by itself as entries change. Wording stays neutral: it reports counts, never judgements about whether the user is doing well.

## Decisions

- Emotions are counted, not scored, because the twelve emotions mix pleasant and unpleasant and "tired" fits neither side. A single mood line would force a judgement the app cannot make.
- No streaks, which can turn into guilt.
- Simple bars drawn by the app, with no charting library, to keep the app small and accessible.

## Constraints and edge cases

- The range is the last 7 or 30 days, including today, counted by the user's local day. Mood entries and thought records are placed by the time they happened.
- Unreadable rows are left out.
- Every bar has a text equivalent, so a screen reader reads each emotion and its count. The bars never rely on colour alone.
- Ties are shown in a stable order.
- Controls are at least 48 px tall, the look stays calm, and the panel works offline.

## Risks and open questions

- Home may feel busy. The panel stays compact; if it grows, a separate screen is a later ticket.

## Acceptance Criteria

- [ ] When the user opens Home, a summary panel with a 7 / 30 day toggle is shown, starting on 7 days.
- [ ] When the range holds entries and records, the header shows how many of each there are.
- [ ] When the range holds feelings, the most frequent emotions are shown as bars with their counts, most frequent first.
- [ ] When the user switches to 30 days, the header and bars update to that range.
- [ ] When the range holds nothing, a kind "not enough yet" message is shown.
- [ ] When the user adds an entry, the panel updates without reopening Home.
