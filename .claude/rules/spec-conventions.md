# Spec Conventions

Two folders under `docs/` hold the project's knowledge: `docs/specs/` is the current state, `docs/changes/` is the changes (the tickets).

## `docs/specs/` — the final spec

- One folder per module, each holding a single `spec.md`, e.g. `docs/specs/authentication/spec.md`, `docs/specs/deployment/spec.md`, `docs/specs/ai-chatbot/spec.md`, `docs/specs/messaging-system/spec.md`. The folder name is the module name.
- A module's `spec.md` is the current state of that module; a ticket's `spec.md` (in `docs/changes/`) is the delta that changes it.
- Links between module docs are relative, e.g. `[storage](../storage/spec.md)`.
- **Each doc is final**: it always reflects the *latest, current* codebase state. It is never a changelog or a history.
- **Every implementation must update every affected doc in `docs/specs/`.** If code changes how a module behaves, its doc changes in the same piece of work. Create a new doc when a new module appears; delete a doc when its module is removed.
- Before implementing, read the relevant docs. Docs are the source of truth for how the system currently works.

### Doc skeleton

Every doc uses these `##` sections, in this order. What goes inside each section is freeform (prose, tables, lists, mermaid diagrams).

1. **Summary** — what the module is and why it exists, in 2 to 4 sentences, plus what it does not cover.
2. **How it works** — the main flows and behavior. Diagrams go here.
3. **Data and files** — data model, libraries used, where the code lives (paths).
4. **Rules and edge cases** — invariants, constraints, failure behavior, gotchas.
5. **Related** — links to neighbouring docs.

- Omit a section only when it truly has no content.
- Add an extra `##` section only when none of the five fit, and place it after them.
- Keep docs high level: no function bodies, exact signatures, or step-by-step pseudocode.

## `docs/changes/` — the changes

Each ticket is a **folder**: `docs/changes/DD-MM-YY-<kebab-title>/` (e.g. `docs/changes/23-11-26-google-auth/`). The folder name is the ticket's identity; there is no sequential number. If a same-day, same-title clash happens, add a short suffix.

**Active vs archived.** `docs/changes/` itself holds only **active** tickets: just created, in progress, blocked, or done but not yet synced. Once bookeeper has synced a ticket (`status: done`, `synced: true`) the folder moves to `docs/changes/archived/DD-MM-YY-<kebab-title>/`. So a glance at `docs/changes/` shows what is still open. The folder name never changes when it moves.

| File       | Owner     | Holds                                                                  |
| ---------- | --------- | ---------------------------------------------------------------------- |
| `spec.md`  | secretary | Frontmatter plus the agreed spec. Never contains tasks.                |
| `tasks.md` | seafarer  | The grouped task checklist. Does not exist until seafarer plans it.    |

### `spec.md`

Starts with frontmatter:

```yaml
---
title: Add Google sign-in
type: feat # feat | fix | refactor | chore | docs | perf | test
priority: medium # low | medium | high | critical
status: todo # todo | in-progress | blocked | done
date: 2026-11-22 # date created (YYYY-MM-DD)
modules: [authentication] # module folders in docs/specs/ this ticket touches
synced: false # true once merged into docs/specs/
depends_on: [23-11-26-user-accounts] # optional: ticket folder names that must be done first
epic: google-login # optional: slug of the delivery effort this ticket belongs to
---
```

`depends_on` and `epic` are optional; omit them when they do not apply (see "Dependencies and epics").

Then these sections, in order. Omit an optional section when it is empty (no "n/a" filler).

1. **User Story** (required) — "As a …, I want …, so that …".
2. **Goal** (required) — why this change, in 1 to 3 sentences.
3. **Scope** (required) — what is in scope, and what is explicitly out of scope. Mention a dependency on another ticket here in a few words, and record it in `depends_on`.
4. **Behavior** (required) — what the system does afterwards, in business terms, centered on the core workflow. No code, and no function or component names.
5. **Decisions** (optional) — what was agreed, and the options rejected with the reason.
6. **Constraints and edge cases** (optional) — limits, failure situations, and invariants that must not break. Implementation-level checks (identifiers, dependencies, APIs) belong here, not in the acceptance criteria.
7. **Risks and open questions** (optional).
8. **Acceptance Criteria** (required) — 3 to 8 `- [ ]` items. Each is an observable behavior of the core workflow and its expected result, written the way a product owner would verify it ("When the user opens X, Y is shown"). No component, API, attribute, or file names, and no niche or corner-case checks; those go under Constraints and edge cases, and seafarer turns them into detailed tests.

**Word cap:** the body of `spec.md` (everything after the frontmatter) must not exceed **600 words**. If the content does not fit, the ticket is too big: split it into several tickets.

### `tasks.md`

`# Tasks`, then groups (`### Group N: <name>`) of `- [ ]` implementation tasks, in order. Each group leaves the app runnable and notes which acceptance criteria it makes passable. No word cap, but keep groups small.

## Dependencies and epics

Two optional frontmatter fields relate tickets to each other. They are not the same thing as `modules`.

**`depends_on`** — a list of ticket folder names that must be `done` before this ticket can be implemented.

- Reference the folder name only, never a path. The name does not change when a ticket moves to `archived/`, so the link stays valid.
- The order of work comes from `depends_on`. There is no `order` or number field.
- Do not store the reverse ("blocks"). It is derived by looking for tickets that list this one.
- It must point to a real ticket, and must not form a cycle. A dependency that is already `done` and archived is satisfied.
- Planning (`tasks.md`) may happen before a dependency is done; implementation may not start until it is.

**`epic`** — a slug naming the delivery effort the ticket belongs to, e.g. `thought-records`. An epic is an **event**, not a category.

- An epic is a bounded piece of work with a start and an end, such as "ship thought records". It is **not** a module and **not** a grouping of old tickets or docs.
- It never appears in `docs/specs/`. Specs are the current state, not a history of efforts.
- An epic has no file or folder and no stored status. It is **open** while any ticket carrying its slug is still in `docs/changes/` (not yet archived), and **closed** once all of them are archived. Progress is read from the tickets.
- A closed epic is never reopened or extended. Follow-up work gets a new epic (or none), and may cite the old one under Scope as related work.
- After archiving, the `epic` field stays in the ticket's frontmatter as a record of the effort it belonged to.
- `modules` says which spec docs a ticket changes; `epic` says which effort delivered it. One epic can touch many modules, and one module is touched by many epics.
- Updating an active ticket in place never adds a new dependency or changes its epic. That is a sign it should be a new ticket.

## Ticket lifecycle

`todo` → `in-progress` → `done` → synced to docs (`synced: true`).

- Tickets are the delta; docs are the result. When a ticket is done, its changes are **merged into `docs/specs/` as a delta**: additions, modifications **and removals** (e.g. a ticket that removes a feature removes it from the doc).
- Seafarer ticks tasks in `tasks.md` and acceptance criteria in `spec.md` as they truly pass.
- A ticket is never deleted. It stays as the record of the change, in `docs/changes/archived/` once synced.
- Tickets created before this layout keep their original, longer specs; they are exempt from the word cap and the section shape.
- Tickets and docs changes are not committed unless the user says so (see git-conventions).

### Updating an active ticket

An **active** ticket (in `docs/changes/`, any status, including `done` but not yet synced) can be updated in place to add or tweak a **minor** behavior, instead of creating a new ticket. **/advisor** judges which is right; the user can overrule it.

Update in place only when **all** hold:

- Same user story and goal as the ticket, only a small addition or adjustment (roughly 1 to 2 new or changed acceptance criteria).
- Same `modules`; no new module.
- The amended `spec.md` still fits the 600-word cap.

Otherwise create a **new ticket** (new user story, new module, spec over the cap, or a follow-up that stands on its own).

To update: **/secretary** amends `spec.md` in place (it stays the current agreement, not a changelog), adds or changes the acceptance criteria as unticked, and, if the ticket was `done`, sets `status: todo`. **/seafarer** then appends new group(s) to `tasks.md` (keeping finished groups ticked) and implements them. **/bookeeper** syncs `docs/specs/` and archives the ticket as usual.

**Archived tickets are not updated.** They are closed records, and the docs, other tickets or even their modules may have moved on since. If asked to update an archived ticket, **/advisor** and **/secretary** warn that it is risky and recommend a new ticket (the archived one can be cited under Scope as related work). Only if the user still insists does secretary move the folder back to `docs/changes/`, set `synced: false`, and treat it as an active ticket.
