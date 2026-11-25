---
title: Calm now on Home
type: feat
priority: medium
status: done
date: 2026-11-25
modules: [coping, app-shell]
synced: true
depends_on: [25-11-26-coping-library]
epic: coping
---

## User Story

As someone who is anxious right now, I want a quick, calm way to see what can help me, so that I can settle without typing or searching.

## Goal

In a hard moment the user needs few taps and calm words, not a form. A quick-use screen on Home shows the user's own coping items, plus a few built-in techniques so it is useful even before the user has added anything.

## Scope

**In scope**
- A calm card on Home that opens a quick-use screen.
- Built-in starter techniques: slow breathing, grounding, and muscle relaxation.
- A calm note that this is a self-help tool and not a crisis service.

**Out of scope**
- Guided animations or timers, and a local crisis line (an open question).
- Editing from this screen; the library is managed through the link provided.

Depends on `25-11-26-coping-library`, which provides the user's items.

## Behavior

Home shows a calm card, "Need to settle?", that opens the quick-use screen. The screen needs no typing and has a Back link and a link to "Edit my coping library".

It shows, in this order:
- **Do:** the built-in techniques first, then the user's own actions. Each shows its steps.
- **Keep nearby:** the user's items, with their detail.
- **Tell myself:** the user's calming words, in larger text.
- **Remember:** the user's About me items.

A group with nothing in it is left out. With an empty library, the built-in techniques are still shown, with a gentle prompt to add personal items. A short, calm line says cebete is a self-help tool and not a substitute for professional care or emergency help.

## Decisions

- Built-in starters, because an empty kit is useless in a panic.
- Plain written steps only; animations bring timers and reduced-motion work and can come later.
- About me appears as "Remember" here, since in this moment it is a reminder, not an item to manage.
- Techniques are written fresh and are not copied from any book.

## Constraints and edge cases

- Built-in techniques are fixed: they cannot be edited or deleted, are not stored in the database, and are not part of backups.
- Changes to the library show here by themselves.
- If the library cannot be read, the built-in techniques still show with a calm message.
- Large, readable text, controls at least 48 px tall, and a calm muted look. No alarm colours.
- Works offline, including opening this screen after a reload.

## Risks and open questions

- The card label could be read as a crisis tool. The calm line must make clear it is not.
- Whether to show a local crisis line is undecided, because it depends on the user's country.

## Acceptance Criteria

- [x] When the user opens Home, a calm "Need to settle?" card is shown.
- [x] When the user taps the card, a screen opens with built-in techniques and their steps.
- [x] When the user has added items, the screen shows them grouped as Do, Keep nearby, Tell myself and Remember.
- [x] When the library is empty, the built-in techniques are still shown with a prompt to add personal items.
- [x] When the user chooses "Edit my coping library", the library opens.
- [x] The screen says calmly that cebete is a self-help tool, not emergency help.
