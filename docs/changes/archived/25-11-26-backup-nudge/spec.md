---
title: Backup nudge
type: feat
priority: medium
status: done
date: 2026-11-25
modules: [backup, app-shell]
synced: true
epic: first-release
---

## User Story

As someone whose data lives only on my device, I want to be reminded to back up when it has been a while, so that I do not lose months of entries.

## Goal

A backup is the only safeguard against cleared site data or a lost phone, but it is easy to forget. Showing when the last backup was made, and a gentle reminder when it is overdue, protects the user from silent data loss.

## Scope

**In scope**
- The date of the last backup, shown in the Backup section of Settings.
- A gentle, dismissible reminder on Home when a backup is overdue.
- Remembering the date of the last backup on the device.

**Out of scope**
- Pop-ups, anything that blocks the user, notifications, scheduled or automatic backups, and cloud storage.

## Behavior

The Backup section in Settings shows "Last backup:" with the date, or "Never backed up" when none was made. The date is set when an export succeeds. Restoring a backup does not count as making one.

Home shows a calm one-line reminder, with a "Back up now" link and a "Not now" button, when the user has data and the last backup is more than 14 days ago or was never made. "Back up now" opens the Backup section in Settings. "Not now" hides the reminder for 7 days, after which it may return. When a recent backup exists, nothing is shown. The reminder sits below the settle card and the quick actions, and is never forced on the user.

## Decisions

- Overdue means more than 14 days, or never; dismissing hides it for 7 days.
- The reminder appears only when there is something to lose: at least one mood entry, thought record or coping item. A brand-new user is not nagged.
- The date and the dismissal are kept in the browser, as a device preference. They are not part of the backup file.

## Constraints and edge cases

- Clearing site data resets both, so the reminder may return. That is acceptable.
- If the browser blocks remembering, the app still works. The date shows as unknown, and the reminder is not shown, so it cannot nag on every visit.
- A failed export does not set the date.
- Dates are shown in the user's local format and time zone.
- Controls are at least 48 px tall, and the reminder uses the calm muted look, with no alarm colours. Works offline.

## Risks and open questions

- A backup the user never actually saves from the browser's download cannot be detected, so "last backup" means "last export made".

## Acceptance Criteria

- [x] When the user has never made a backup, Settings says "Never backed up".
- [x] When the user makes a backup, Settings shows today's date as the last backup.
- [x] When the user has data and no backup in the last 14 days, Home shows a gentle reminder with "Back up now".
- [x] When the user taps "Back up now", the Backup section in Settings opens.
- [x] When the user taps "Not now", the reminder disappears and does not return for 7 days.
- [x] When the last backup is recent, or the user has no data yet, Home shows no reminder.
