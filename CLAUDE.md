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

## Project Context

Read `TREE.md` + `ARCHITECTURE.md` before making changes — they describe the full structure
and working flow so you can identify the correct file without scanning the whole codebase.
