---
title: App foundation
type: feat
priority: high
status: done
date: 2026-11-24
modules: [app-shell, storage]
synced: true
---

## User Story

As a person practising CBT, I want a private app named cebete that installs on my phone and works offline, so that I can use it anywhere without an account or a server.

## Goal

Lay the technical base every later module builds on: a project with quality tooling, an installable offline app with its own identity, and a local-only data store. Settling this once, on an empty app, keeps later tickets cheap.

## Scope

**In scope**
- A new project in strict TypeScript, using React and Vite.
- Quality tooling: unit and component testing, code formatting, and linting, configured to sensible best practices.
- Installable and offline-capable (PWA).
- The app identity: the name "cebete" and an app icon.
- A local on-device database that later modules add their data to, with persistent storage requested.

**Out of scope**
- Visual theme, component library and navigation (ticket `24-11-26-app-shell-design`).
- Any CBT feature, accounts, backend, cloud sync.
- Export and import (separate ticket).

This ticket has no dependencies.

## Behavior

When the user opens the app, a minimal screen showing the name cebete is displayed. The browser offers to install it, and once installed it opens as "cebete" with its own icon. After the first load the app opens and works with no network. All data stays in the browser on the user's device and is never sent anywhere. On first use the app asks the browser to keep stored data persistently.

## Decisions

- React with Vite and a PWA plugin: mature PWA tooling and live-updating data views.
- Dexie on IndexedDB, local-first, no backend. Rejected: a backend with sync, which adds accounts and privacy risk a personal tracker does not need.
- Tooling: Vitest for tests, Prettier for formatting, ESLint for linting. Best-practice configuration is left to the implementer, including accessibility and React hooks rules, and Prettier and ESLint must not conflict.
- The icon is vector artwork produced by a one-time script. It is a development tool, not part of the running app.

## Constraints and edge cases

- Installable PWAs on many devices need raster icons, so the script also produces the standard PNG sizes, including a maskable variant.
- The data schema is versioned from the start so later changes can migrate existing data.
- Tests can exercise the database without a real browser.
- If the browser refuses persistent storage, the app keeps working.
- Clearing site data erases all app data. This is a known limit, mitigated later by export.
- The five checks (typecheck, format, lint, build, test) pass in the order set by the workflow conventions.

## Risks and open questions

- Browsers may evict stored data under storage pressure. Persistent storage lowers the risk but does not remove it.

## Acceptance Criteria

- [x] When the user opens the app, a screen showing the name cebete is displayed.
- [x] When the user visits in a supporting browser, they can install it as "cebete" with its icon and launch it like an app.
- [x] After the first visit, the app opens and works with no internet connection.
- [x] The app keeps its data on the device only and sends no user data to any server.
- [x] The project's typecheck, format, lint, build and test checks all pass.
