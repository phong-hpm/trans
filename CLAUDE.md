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

Claude cannot delete files. When a file should be deleted, leave a comment in the response:
```
# To delete: rm path/to/file
```
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

### Starting a feature
When the user's message is prefixed with `[feature]`, `[fix]`, or `[chore]`:
1. Checkout `main` and pull latest
2. Create a branch: `feat/...`, `fix/...`, or `chore/...`
3. Implement with local commits only — do not push until told

### Pushing
Push when the user's intent is clearly to publish — e.g. "push", "push it", "push code",
"đẩy lên", "ship it". Use intent, not exact wording.

### Creating a PR
When the user signals they want a PR — e.g. "tạo PR", "open PR", "make a PR", "PR đi":
1. Push the branch
2. Show the draft title + body for review
3. Wait for explicit confirmation before creating

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

## Extension Version Bump

After every code change to the extension, increment the patch version in `extension/public/manifest.json`:
```
"version": "1.0.4" → "1.0.5"
```
Do this as the last step before finishing the task.

## Project Context

Read `TREE.md` + `ARCHITECTURE.md` before making changes — they describe the full structure
and working flow so you can identify the correct file without scanning the whole codebase.
