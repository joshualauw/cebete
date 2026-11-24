# Code Conventions

This is a **TypeScript** project. All source, tests and config that can be written in TypeScript must be. Plain `.js` is only for tooling scripts that cannot be TypeScript.

Skills that write or change code (currently **/seafarer**) must follow this file. Skills that only touch tickets and docs (**/advisor**, **/secretary**, **/bookeeper**) do not need it.

## TypeScript best practices

- Keep `strict` mode on. Do not loosen `tsconfig` options to make an error go away.
- **Never use `any`**, explicit or implicit. Use a precise type, a generic, or `unknown` plus narrowing (type guards, schema validation) when the type is truly not known.
- Do not use non-null assertions (`!`) or blanket casts (`as Foo`, `as unknown as Foo`) to silence the compiler. Fix the type or narrow the value instead.
- Do not use `@ts-ignore`, `@ts-nocheck` or `eslint-disable` to get green. `@ts-expect-error` is allowed only with a one-line reason, and only when there is no better option.
- Type function parameters and return values of exported functions explicitly. Let inference handle local variables.
- Prefer `type` for object shapes and unions, and string-literal unions or `as const` objects over `enum`. Model states with discriminated unions rather than loose optional fields.
- Use `import type` for type-only imports (enforced by lint).
- Prefer `readonly` and immutable updates. Use `const` by default, never `var`.
- Handle `undefined` explicitly: indexed access can return `undefined` (`noUncheckedIndexedAccess` is on), so check before use.
- Treat external data (IndexedDB, network, `JSON.parse`, storage) as `unknown` until validated.

## Comments

- Do not comment excessively. Clear names and types should explain the code; do not narrate what the code already says.
- Add a comment only when it is very important or must-know: a non-obvious reason (the *why*), a workaround, a hidden constraint, or a gotcha that would surprise the next reader.
- No commented-out code, no changelog or ticket-history comments, and no section-banner or filler comments.
- `@ts-expect-error` still needs its one-line reason (see above).

## Imports

- Use the `@` alias for anything inside `src/` (for example `@/db/db`). Do not use relative paths that climb out of the current folder (`../../`).
- A relative import (`./thing`) is fine only for a file in the same folder.
- The alias is configured in `tsconfig`, Vite and Vitest so editor, build and tests all resolve it the same way. Keep the three in sync if it changes.
- Order imports: external packages first, then `@/` imports, then relative ones. Prettier and ESLint keep the formatting; do not hand-tune it.

## Tests

- All tests live in the dedicated top-level **`tests/`** folder, not next to the source files.
- Mirror the `src/` structure inside it, for example `src/db/db.ts` is tested by `tests/db/db.test.ts`.
- Name test files `*.test.ts` or `*.test.tsx`. Shared setup and helpers live in `tests/` too (for example `tests/setup.ts`).
- Import the code under test through the `@` alias, never through a relative path into `src/`.
- Test observable behavior, not implementation details. Do not skip tests (`.skip`, `.only`) or delete them to get green.

## Formatting and linting

- **Prettier** is the only formatter. Do not hand-format or argue with it; run `format` and accept the result. Its config is `.prettierrc`.
- **ESLint** (flat config, `typescript-eslint` strict and stylistic type-checked rules, React hooks and a11y rules) is the linter. Fix every error and warning at the source.
- ESLint must never fight Prettier: formatting rules stay off in ESLint (`eslint-config-prettier` stays last in the config).
- Do not add `eslint-disable` or `prettier-ignore` comments to dodge a rule. If a rule is genuinely wrong for the project, raise it with the user and change the config deliberately.

## Checks after every implementation

After every implementation, run these checks **in this order**. Each one is an npm script.

1. `typecheck` — the TypeScript compiler (`tsc -b`) finds type errors.
2. `format` — Prettier rewrites files to the project style.
3. `lint` — ESLint finds code-quality and correctness problems.
4. `build` — the production build completes.
5. `test` — the full Vitest suite passes.

- Do not skip a step or reorder them.
- If a step fails, fix the problem, then rerun **from that step** (and every step after it) before moving on.
- A change is not done until all five pass in the same run.
- Report any step that could not be run, and why.
- On this machine run the checks from PowerShell, not the Bash tool (Vitest fails under Git Bash).
