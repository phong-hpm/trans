# Project Rules

## Documentation & Commands

All commands in documentation and rule files must be written in English.
Applies to: setup guides, README, ARCHITECTURE.md, and all other project documentation.

## Code Comments

All comments in source code must be written in English.
Includes: inline comments, block comments, JSDoc, and file header comments.

## File Header Comments

Every source file must have a short header comment on line 1 describing its role, for example:
```
// content-script.tsx — Injects translate icons into GitHub Issues blocks
```

## Deleting Files

Claude can delete files directly using the shell when a file is no longer needed.
Never overwrite the file content with a placeholder.

## Code Style — Functions

Always use arrow functions. Regular `function` declarations are only acceptable when:
- The function needs its own `this` binding
- It is a generator function (`function*`)

```ts
// correct
const handleClick = () => { ... }
const translate = async (text: string) => { ... }

// incorrect
function handleClick() { ... }
async function translate(text: string) { ... }
```

## Off-limits Files

Never read `yarn.lock` under any circumstances — not when adding packages, removing packages,
or resolving dependency issues. It is auto-generated and contains no actionable information.

## Keeping TREE.md in sync

After any change that creates, deletes, or moves a file, update `TREE.md` to reflect the new
structure before finishing the task. This keeps the project map accurate for future sessions.

## Git Workflow

### Commits
Only commit when explicitly asked. Never auto-commit after finishing a task.
The user reviews code before committing.

### Starting a feature
When the user's message is prefixed with `[feature]`, `[fix]`, or `[chore]`:
1. Checkout `main` and pull latest
2. Create a branch: `feat/...`, `fix/...`, or `chore/...`
3. Implement — do not commit or push until told

### Pushing
Push when the user's intent is clearly to publish — e.g. "push", "push it", "push code",
"đẩy lên", "ship it". Use intent, not exact wording.

### Creating a PR
Only create a PR when explicitly asked — e.g. "tạo PR", "open PR", "make a PR", "PR đi".
Never create a PR automatically after finishing a task.
Steps:
1. Push the branch
2. Create the PR immediately (no re-confirmation needed)

## Backend — Import Aliases

Always use `@/` for imports inside `backend/src/`. Never use relative paths like `../../`.

```ts
// correct
import { translateSegments } from '@/services/translate.service';

// incorrect
import { translateSegments } from '../../services/translate.service';
```

This is enabled via `tsconfig.json` `paths` + `tsconfig-paths` (dev) + `tsc-alias` (build).

## Backend — Service Function Params

Service functions must accept a single object param, not positional args. This makes call sites readable and the function easy to extend.

```ts
// correct
export const translateSegments = async ({ segments, targetLanguage, provider, model }: TranslateParams) => { ... }

// incorrect
export const translateSegments = async (segments, targetLanguage, provider, model) => { ... }
```

## Extension — Lint After Every Edit

After every file edit session in the extension, run in order inside `extension/`:
1. `yarn tsc` — fix all TypeScript errors first
2. `yarn fix` — then fix lint/format errors

```
cd extension && yarn tsc && yarn fix
```
Read the output of each step. Fix all errors before finishing the task.

## Extension Version Bump

After every code change to the extension, increment the patch version in `extension/public/manifest.json`:
```
"version": "1.0.4" → "1.0.5"
```
Do this as the last step before finishing the task.

## Project Context

Read `TREE.md` + `ARCHITECTURE.md` before making changes — they describe the full structure
and working flow so you can identify the correct file without scanning the whole codebase.

## Task Tracking Workflow

Tasks are tracked in `working-tasks/`. Numbered `.md` files (e.g. `01-feature.md`) are written by the user. Claude's working file is prefixed with `_` so it sorts to the top.

**Claude's working file:** `working-tasks/_progress.md`

---

### Command: "check task"

1. Read the first line of `_progress.md` — it has the form `DONE [x/y]`
2. If `x < y` (unfinished tasks remain): report which tasks are incomplete and **stop** — do not overwrite
3. If `x === y` (all done, or file is empty/missing): proceed to capture new tasks:
   - Read all `.md` files in `working-tasks/` (excluding `_progress.md`)
   - Overwrite `_progress.md` with all tasks consolidated — do not rephrase or summarize
   - First line must be `DONE [0/y]` where `y` = total number of task items
4. Reply with a brief summary of what was captured

---

### Command: "continue task"

1. Read the first line of `_progress.md` — it has the form `DONE [x/y]`
2. If `x === y`: report that all tasks are already done and **stop**
3. If `x < y`: proceed to implement the next pending `- [ ]` task

---

### Command: "do task"

1. Read `_progress.md` only — ignore all numbered `.md` files
2. Implement **all** pending `- [ ]` items one by one, in order
3. After completing each task:
   - Mark done: `- [x] ~~Task title~~`
   - Update the header: increment `x` in `DONE [x/y]`
4. Continue until all tasks are done or a blocker is hit
5. Do not modify the original numbered files

---

### Format of `_progress.md`
```md
DONE [2/5]

## 1.md

- [x] ~~Point that is done~~
- [x] ~~Another done point~~
- [ ] Point still pending
- [ ] Point still pending
- [ ] Point still pending
```

---

### Rules
- Never modify the original numbered task files
- `DONE [x/y]` on line 1 is always kept in sync: `x` = completed count, `y` = total count
- Tasks are copied verbatim from source files — do not rephrase or summarize
