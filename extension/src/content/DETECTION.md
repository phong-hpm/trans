# Content Script: Platform Detection & Block Injection

This document explains how the extension detects which page it is on, discovers
translatable blocks, and keeps the UI in sync with dynamic DOM changes
(GitHub Turbo navigation, async rendering, inline edits).

---

## Overview

The content script runs on every `https://github.com/*` URL (see `manifest.json`
`content_scripts.matches`). Not every GitHub page is relevant — only issue detail
pages have translatable blocks. The extension must:

1. **Detect** whether the current page is a supported platform page.
2. **Inject** translate UI (buttons / toolbars) into each translatable block.
3. **Stay in sync** when the page changes without a full reload (Turbo navigation)
   or when new blocks appear (new comments posted inline).

---

## Files Involved

| File                          | Role                                                      |
| ----------------------------- | --------------------------------------------------------- |
| `main.tsx`                    | Entry point — wires everything together                   |
| `dom/observerDom.ts`          | `MutationObserver` utilities                              |
| `dom/injectDom.tsx`           | Block injection engine (`processBlocksDom`)               |
| `dom/mountDom.tsx`            | Global UI mounts (toaster, sidebar, translate-all button) |
| `platforms/index.ts`          | `detectPlatform(url)` — maps URL to adapter               |
| `platforms/types.ts`          | `PlatformAdapter` and `Block` interfaces                  |
| `platforms/github/index.ts`   | GitHub adapter — queries DOM for blocks                   |
| `platforms/github/queries.ts` | All GitHub CSS selectors in one place                     |

---

## Step 1 — Platform Detection

```ts
// platforms/index.ts
const PLATFORMS: PlatformAdapter[] = [githubAdapter];

export const detectPlatform = (url: string): PlatformAdapter | null =>
  PLATFORMS.find((p) => p.pagePattern.test(url)) ?? null;
```

Each adapter exposes a `pagePattern: RegExp`. For GitHub:

```ts
// platforms/github/queries.ts
pagePattern: /\/issues\/\d+/; // matches /owner/repo/issues/123
```

`detectPlatform` returns the matching adapter, or `null` if the current URL is
not a supported page (e.g. issue list, pull requests, settings).

To add a new platform: create a new adapter in `platforms/<name>/`, add it to
the `PLATFORMS` array in `platforms/index.ts`.

---

## Step 2 — What Is a Block?

A `Block` is a translatable unit on the page:

```ts
interface Block {
  blockType: BlockTypeEnum; // Title | Task | Comment
  containerEl: HTMLElement; // stable outer wrapper (survives re-renders)
  contentEl: HTMLElement; // element whose text is translated
  getLiveElement?: () => HTMLElement | null; // re-queries DOM (avoids stale refs)
  getContextBlocks?: () => ContextBlock[]; // preceding content for AI context
}
```

The GitHub adapter (`platforms/github/index.ts`) returns up to three block types:

| Block type | DOM selector                                     | Notes                    |
| ---------- | ------------------------------------------------ | ------------------------ |
| `Title`    | `[data-component="PH_Title"] bdi.markdown-title` | One per page             |
| `Task`     | `#issue-body-viewer .markdown-body`              | Issue description body   |
| `Comment`  | `.react-issue-comment .markdown-body`            | One per comment, dynamic |

`getContextBlocks` is called at translate time (not at block discovery time) so
it always includes the latest state of preceding blocks, including comments added
after initial load.

---

## Step 3 — Two Watch Mechanisms

### 3a. Retry Interval (initial load only)

GitHub renders content asynchronously — the content script may fire before the
issue title or comments exist in the DOM.

```ts
// main.tsx — runs once at startup when starting on a platform page
let attempts = 0;
const retry = setInterval(() => {
  processBlocksDom(initialPlatform.getBlocks());
  // also mounts translate-all button if anchor is available
  if (++attempts >= 10) clearInterval(retry);
}, 500);
```

- Runs at most **10 times × 500 ms = 5 seconds** after load.
- Stops itself after 10 attempts.
- Only active at startup; the observer below handles all subsequent changes.

### 3b. MutationObserver (always active)

```ts
// dom/observerDom.ts
observer.observe(document.body, { childList: true, subtree: true });
```

- Watches the **entire `document.body` subtree** for **node additions/removals**
  (`childList: true`). Attribute changes are intentionally excluded to avoid a
  feedback loop (the translation engine writes `data-original` attributes).
- Debounced 200 ms — rapid bursts of mutations (e.g. GitHub streaming a long
  comment) collapse into a single callback.

The observer is set up **at module level**, unconditionally. This is the key
design decision:

> The observer must not be gated on platform detection at load time.
> If the user starts on a non-platform page (issue list), platform detection
> returns `null` and no retry interval is started — but the observer is still
> active. When Turbo navigation moves the user to an issue page, the DOM changes,
> the observer fires, and platform detection now returns a valid adapter.

---

## Step 4 — Observer Callback Logic

```
MutationObserver fires (debounced 200ms)
  │
  ├─ detectPlatform(location.href)
  │     → null?  return early, do nothing
  │     → adapter? continue
  │
  ├─ URL changed since last tick?  (Turbo navigation)
  │     → update lastUrl
  │     → setPlatformName(platform.name)
  │     → await historyStore.init(location.href)   ← loads saved translations for new page
  │     → if autoTranslateAll: dispatch trans:translate-all (delayed 1s)
  │
  ├─ mountPlatformDom()   ← idempotent: toaster + sidebar, bail if already mounted
  │
  ├─ platform.getBlocks() → Block[]
  │
  ├─ processBlocksDom(blocks)
  │     → for each block:
  │         create anchor element (idempotent by data-attr check)
  │         mount React translate UI into shadow DOM
  │         register in blockRoots map (keyed by anchor element)
  │
  └─ mountTranslateAllDom(anchor)   ← idempotent
```

All mount operations are **idempotent** — they check for an existing
`data-trans-*` attribute before doing anything, so calling them on every
observer tick is safe and cheap.

---

## Step 5 — Block-Level Observer

In addition to the page-level observer, each mounted block runs its own
`observeBlockDom` watcher (`dom/observerDom.ts`):

```ts
// Watches the stable containerEl of the block
observer.observe(containerEl, { childList: true, subtree: true });
```

This handles the case where GitHub replaces the inner `markdown-body` element
(e.g. after a comment edit or token refresh) while the outer wrapper stays in
place. When the inner element is replaced, the block-level observer re-extracts
text nodes and re-applies the existing translation without calling the API again.

---

## Turbo Navigation Sequence (example)

```
User is on: github.com/owner/repo/issues  (issue list)
  content script loads
  detectPlatform → null
  no retry interval started
  observePageDom active ✓

User clicks an issue → Turbo replaces DOM
  MutationObserver fires (debounced 200ms)
  detectPlatform(location.href) → githubAdapter ✓
  location.href !== lastUrl → URL change detected
  historyStore.init(new URL) → loads saved translations
  mountPlatformDom() → toaster + sidebar mounted
  getBlocks() → [title, task, ...comments]
  processBlocksDom() → injects translate UI
```

---

## Adding a New Platform

1. Create `platforms/<name>/queries.ts` — all CSS selectors.
2. Create `platforms/<name>/index.ts` — implement `PlatformAdapter`:
   - `name`: display name
   - `pagePattern`: RegExp matching the relevant URLs
   - `getBlocks()`: return `Block[]`
   - `getHeaderAnchor()` (optional): where to mount the Translate All button
3. Add the adapter to `PLATFORMS` in `platforms/index.ts`.

No changes needed in `main.tsx` or `observerDom.ts`.
