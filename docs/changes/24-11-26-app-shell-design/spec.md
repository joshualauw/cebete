---
title: App shell and design
type: feat
priority: high
status: done
date: 2026-11-24
modules: [app-shell]
synced: true
---

## User Story

As a person practising CBT, I want a calm, easy-to-navigate mobile interface, so that using the app daily feels relaxing and effortless.

## Goal

Give cebete its look and its navigation, so every later module plugs into one consistent, mobile-first experience.

## Scope

**In scope**
- A visual theme built on Chakra UI: a calm teal look, light mode only.
- A bottom navigation bar with three sections: Home, Mood and Settings.
- A home screen.
- Placeholder screens for Mood and Settings until their own tickets fill them.

**Out of scope**
- Dark mode.
- The content of the mood log and of the Settings screen (export and import).
- Navigation items for modules that do not exist yet.

Depends on `24-11-26-app-foundation`.

## Behavior

When the user opens the app, they see the home screen with a short, friendly welcome. A bottom bar, always visible and within thumb reach, shows Home, Mood and Settings, with the current section highlighted. Tapping an item switches to that section instantly. Until their tickets are delivered, Mood and Settings show a simple "coming soon" placeholder.

The look is calm: a soft teal as the main colour, light neutral surfaces, generous spacing and gentle contrast. Warnings and errors use muted tones, never alarming red. The layout is designed for phones first and stays tidy on larger screens.

## Decisions

- Chakra UI for styling, with the theme defined centrally so the palette is set once.
- Teal, calm, light mode only. Dark mode is cheap to add later through the theme, so it is deferred.
- Bottom bar, as on a mobile app. It holds at most five items, so new modules must earn a place or live under an existing section.
- Settings is the home for backup tools, so export and import will appear there.

## Constraints and edge cases

- Tap targets are large enough for comfortable touch use.
- On phones with notches or a home indicator, the bar is not covered.
- The current section is part of the address, so reloading or using the browser's back button keeps the user in place.
- Text and controls keep readable contrast on the teal theme.

## Acceptance Criteria

- [x] When the user opens the app, a home screen with a welcome message is shown.
- [x] A bottom bar with Home, Mood and Settings is visible on every screen, with the current section highlighted.
- [x] When the user taps a bar item, that section opens.
- [x] When the user reloads the page on a section, they stay on that section.
- [x] The app appears in a calm teal, light theme on a phone-sized screen and remains tidy on a desktop browser.
