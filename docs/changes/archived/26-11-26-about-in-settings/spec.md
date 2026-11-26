---
title: About in Settings
type: feat
priority: medium
status: done
date: 2026-11-26
modules: [app-shell]
synced: true
epic: public-launch
---

## User Story

As someone using cebete, I want to read what the app does with my data and what it is not, so that I can trust it.

## Goal

The privacy promise and the "self-help, not medical advice" note are scattered: the disclaimer appears on Thoughts and the settle screen, and the privacy promise only in the docs. A public app should state both, in one place, in the app itself.

## Scope

**In scope**
- An About section on the Settings screen, below Backup.

**Out of scope**
- A link to the source code, country-specific help lines, a separate terms or privacy page, analytics, an update notice, and a list of licences.

## Behavior

Settings shows an "About" section below Backup with:
- the app name and its version;
- a privacy statement: everything you record stays on this device, cebete sends nothing anywhere and has no analytics, and backup files are plain text, so keep them safe;
- a disclaimer: cebete is a self-help tool, and not a substitute for professional care or emergency help.

The text is calm, short and in plain words.

## Decisions

- One place for the statements. The disclaimer also stays where it already is, on Thoughts and the settle screen.
- No help-line numbers, because the right one depends on the user's country.

## Constraints and edge cases

- The section works offline and makes no network request.
- The version shown is the app's own, and is set to 0.1.0 for launch.
- The look stays calm, and the section is readable by a screen reader.
- The Backup section works exactly as before.

## Acceptance Criteria

- [x] When the user opens Settings, an About section is shown below Backup.
- [x] When the user reads About, they see the app name and its version.
- [x] When the user reads About, it says that everything stays on the device, with no analytics.
- [x] When the user reads About, it says that cebete is a self-help tool and not a substitute for professional care or emergency help.