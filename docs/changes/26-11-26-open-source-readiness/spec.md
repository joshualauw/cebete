---
title: Open source readiness
type: docs
priority: medium
status: todo
date: 2026-11-26
modules: [deployment]
synced: false
depends_on: [26-11-26-deploy-to-vercel]
epic: public-launch
---

## User Story

As the owner of cebete, I want the repository ready for the public, so that others can understand, run and reuse it safely.

## Goal

The repository has no README and no licence, and a copyrighted book PDF sits untracked beside the code. Before it goes public, it needs a front page, a licence and a guard against that file.

## Scope

**In scope**
- A root `README.md`, which GitHub shows as the repository's front page.
- An MIT `LICENSE` in the name of Joshua William, for 2026.
- The book PDF ignored by git, and the stray `.gitignore` edit tidied.

**Out of scope**
- A repository link or a hosted-app link in the README: those go in GitHub's own About section.
- Automated checks, a contributing guide, rewriting history, and changing the commit email.

Depends on `26-11-26-deploy-to-vercel`, which settles how the app is hosted.

## Behavior

The README says, in plain words:
- what cebete is: a private CBT tracker with a mood log, thought records with challenge and test, a coping library with a quick "settle now" screen, a Home summary, and backup;
- the privacy promise: everything stays in the browser, there is no analytics, and backup files are plain text;
- a short note that it is a self-help tool, not medical advice;
- how to run it: install, start it, build it, and run the five checks;
- that the web address is the identity of the data, so a backup is exported before moving it;
- the licence.

The `LICENSE` is the standard MIT text, naming Joshua William and 2026. Git ignores the book PDF, so it cannot be added by accident.

## Decisions

- `.claude/` and `docs/` stay public, since they show how the app was built.
- History is left as it is, including the commit email. The owner can use GitHub's noreply address from now on.
- No links in the README, since GitHub's About section holds them.

## Constraints and edge cases

- The README describes only what the app does today, matching the docs, and holds no personal data.
- The PDF stays on disk but is never tracked.
- The `.gitignore` ends with a newline, like the other files.

## Risks and open questions

- Once the repository is public, everything already in its history stays visible, including the commit email. The owner should skim the history before making it public.

## Acceptance Criteria

- [ ] When someone opens the repository on GitHub, a README explains what cebete is and how it treats their data.
- [ ] When someone reads the README, they find a clear note that it is a self-help tool and not medical advice.
- [ ] When someone follows the README, they can install, run and build the app.
- [ ] When someone opens the licence, it is the MIT licence in the name of Joshua William, for 2026.
- [ ] When the book PDF is added to the project folder, git does not offer it for committing.
- [ ] The README holds no repository link and no hosted-app link.
