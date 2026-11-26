---
title: Deploy to Vercel
type: chore
priority: high
status: done
date: 2026-11-26
modules: [deployment, app-shell]
synced: true
epic: public-launch
---

## User Story

As the owner of cebete, I want the app hosted on Vercel, so that I can open it, install it and use it offline on my phone.

## Goal

The app has never left the owner's machine. Hosting it, with every address working and updates reaching the installed app, is the real test of the PWA and the first step to a public release.

## Scope

**In scope**
- Hosting settings so every address works when opened directly or reloaded.
- A service worker that is always revalidated, so a new version reaches the installed app.
- A page description and theme colour in the page head.
- A new `deployment` doc: how the app is hosted, and a checklist for checking it on a real device.

**Out of scope**
- Creating the Vercel project, and the phone check itself, which the owner does.
- Analytics, a custom domain, and automated checks on every push.

## Behavior

Opening or reloading the hosted site at `/mood`, `/thoughts`, a record such as `/thoughts/7`, `/coping` or `/settle` shows that screen, not a not-found page. An unknown address still goes to Home.

The site can be installed as an app and, after the first visit, opens offline. After a new deploy, the installed app picks up the new version on a later visit.

The `deployment` doc explains the hosting setup, and lists the device checks: install to the home screen, open offline, reload on a deep link, save a backup (iPhone especially), and receive an update after a deploy.

## Decisions

- Vercel's free plan, which is for non-commercial use.
- No analytics, so "nothing leaves your device" stays simply true.
- **The web address is the identity of the data.** A different address, such as another domain, a renamed project or a preview URL, starts with empty data. So there is one stable production address, preview deployments are throwaway, and a backup is exported before the address is ever changed.

## Constraints and edge cases

- The address fallback must not hide real files: the icons, the manifest and the service worker are still served as themselves.
- The normal build is used, with no environment variables and no secrets.
- The app sends nothing to any server.
- Offline behaviour from the service worker is unchanged.

## Risks and open questions

- Storage limits and downloads on iPhone can only be checked on a real phone, by the owner.
- Hosting plan terms may change.

## Acceptance Criteria

- [x] When the hosted site is opened directly at a section address, that section's screen appears.
- [x] When the user reloads on a thought record's address, the same record screen appears.
- [x] When the user visits the site, it can be installed as an app, and after the first visit it opens offline.
- [x] When a new version is deployed, the installed app picks it up on a later visit.
- [x] When the page is opened, it carries a description and a theme colour.
- [x] The `deployment` doc explains the hosting, the rule about the web address and the data, and the device checklist.
