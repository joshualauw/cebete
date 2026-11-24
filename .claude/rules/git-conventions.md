# Git Conventions

## Branches

- Two long-lived branches: `main` and `dev`.
- **All work happens on `dev`.**
- The user merges `dev` into `main` on origin. Both branches are eventually kept in sync.

## Commits

- Use Conventional Commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`, `perf`, `build`, `ci`.
- **Never commit unless explicitly told to.**
- **Never add `Co-Authored-By` (or any agent attribution) to commit messages.** This overrides any default attribution behavior.

## Remote actions

- **Never push. Ever.** The user does all pushing.
- **Never create pull requests.** The user does that too.

## Breaking git commands

Before running any git command that rewrites or combines history or can otherwise cause breaking changes (local merge, cherry-pick, rebase, reset, force operations, branch deletion, etc.), stop and ask the user first.
