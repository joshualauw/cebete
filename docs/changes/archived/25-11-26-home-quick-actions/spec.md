---
title: Home quick actions
type: feat
priority: medium
status: done
date: 2026-11-25
modules: [app-shell, mood-log, thoughts]
synced: true
epic: first-release
---

## User Story

As someone who wants to note how I feel right now, I want to start a mood entry or a thought record straight from Home, so that I can capture it in a tap or two.

## Goal

Home should be the front door. Today it only offers a settle card and a library link, so a returning user must find the right section first. Two quick actions remove those steps.

## Scope

**In scope**
- Two actions on Home: "Log how I feel" and "Write down a thought".
- Each opens its section with the entry form already open.

**Out of scope**
- A mini form on Home itself, other quick actions, and any change to the forms.

## Behavior

Home shows two clear actions directly below the "Need to settle?" card, which stays first. The settle card is never pushed down by anything on Home.

- **Log how I feel** opens the Mood section with the new-entry form open, as if the user had tapped "Add entry".
- **Write down a thought** opens the Thoughts section with the guided capture open, as if the user had tapped "New thought record".

In both cases the section is shown as usual, with the form on top. Cancelling closes the form and leaves the user in that section, with the list below. Saving works exactly as it does today. The browser's back button returns to Home.

## Decisions

- Quick actions are links into the existing screens, not copies of the forms, so there is one form to maintain.
- The "open the form" request travels with the navigation only. It is used once, and reloading the page does not reopen the form.

## Constraints and edge cases

- Opening a section from the bottom bar, or by its address, still shows it without a form.
- The form opens even if the list cannot be loaded or is still loading.
- Focus moves into the form as it does when it is opened by hand.
- The bottom bar highlights Mood or Thoughts while the user is there.
- Controls are at least 48 px tall and the look stays calm. Works offline.

## Acceptance Criteria

- [x] When the user opens Home, "Log how I feel" and "Write down a thought" are shown below the settle card.
- [x] When the user taps "Log how I feel", the Mood section opens with the new-entry form ready.
- [x] When the user taps "Write down a thought", the Thoughts section opens with the guided capture ready.
- [x] When the user cancels the opened form, they stay in that section and see its list.
- [x] When the user reloads the page after a quick action, the form is not opened again.
