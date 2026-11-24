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
---
```

Then these sections, in order. Omit an optional section when it is empty (no "n/a" filler).

1. **User Story** (required) — "As a …, I want …, so that …".
2. **Goal** (required) — why this change, in 1 to 3 sentences.
3. **Scope** (required) — what is in scope, and what is explicitly out of scope. Note any dependency on another ticket here.
4. **Behavior** (required) — what the system does afterwards, in business terms, centered on the core workflow. No code, and no function or component names.
5. **Decisions** (optional) — what was agreed, and the options rejected with the reason.
6. **Constraints and edge cases** (optional) — limits, failure situations, and invariants that must not break. Implementation-level checks (identifiers, dependencies, APIs) belong here, not in the acceptance criteria.
7. **Risks and open questions** (optional).
8. **Acceptance Criteria** (required) — 3 to 8 `- [ ]` items. Each is an observable behavior of the core workflow and its expected result, written the way a product owner would verify it ("When the user opens X, Y is shown"). No component, API, attribute, or file names, and no niche or corner-case checks; those go under Constraints and edge cases, and seafarer turns them into detailed tests.

**Word cap:** the body of `spec.md` (everything after the frontmatter) must not exceed **600 words**. If the content does not fit, the ticket is too big: split it into several tickets.

### `tasks.md`

`# Tasks`, then groups (`### Group N: <name>`) of `- [ ]` implementation tasks, in order. Each group leaves the app runnable and notes which acceptance criteria it makes passable. No word cap, but keep groups small.

## Ticket lifecycle

`todo` → `in-progress` → `done` → synced to docs (`synced: true`).

- Tickets are the delta; docs are the result. When a ticket is done, its changes are **merged into `docs/specs/` as a delta**: additions, modifications **and removals** (e.g. a ticket that removes a feature removes it from the doc).
- Seafarer ticks tasks in `tasks.md` and acceptance criteria in `spec.md` as they truly pass.
- A ticket is never deleted. It stays as the record of the change.
- Tickets created before this layout keep their original, longer specs; they are exempt from the word cap and the section shape.
- Tickets and docs changes are not committed unless the user says so (see git-conventions).
