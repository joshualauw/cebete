---
title: About in Settings
type: feat
priority: medium
status: todo
date: 2026-11-26
modules: [app-shell]
synced: false
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
- Country-specific help lines, a separate terms or privacy page, analytics, an update notice, and a list of licences.

## Behavior

Settings shows an "About" section below Backup with:
- the app name and its version;
- a privacy statement: everything you record stays on this device, cebete sends nothing anywhere and has no analytics, and backup files are plain text, so keep them safe;
- a disclaimer: cebete is a self-help tool, and not a substitute for professional care or emergency help;
- a "Source code" link that opens the project's repository in a new tab.

The text is calm, short and in plain words.

## Decisions

- One place for the statements. The disclaimer also stays where it already is, on Thoughts and the settle screen.
- No help-line numbers, because the right one depends on the user's country.

## Constraints and edge cases

- The link opens safely in a new tab, and the section's text works offline. Only following the link needs a connection.
- The version shown is the app's own. It is currently 0.0.0, so the owner may set a real one before launch.
- Controls are at least 48 px tall, the look stays calm, and the section is readable by a screen reader.
- The Backup section works exactly as before.

## Acceptance Criteria

- [ ] When the user opens Settings, an About section is shown below Backup.
- [ ] When the user reads About, they see the app name and its version.
- [ ] When the user reads About, it says that everything stays on the device, with no analytics.
- [ ] When the user reads About, it says that cebete is a self-help tool and not a substitute for professional care or emergency help.
- [ ] When the user follows the "Source code" link, the project's repository opens in a new tab.
