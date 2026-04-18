# Architecture

## Overview

Monorepo with two packages:

| Package | Stack |
|---|---|
| `backend/` | Node.js, Express, TypeScript, OpenAI SDK |
| `extension/` | Chrome MV3, React 18, TypeScript, Tailwind v3, Shadow DOM |

---

## How the Extension Injects into GitHub

`content-script.tsx` runs on every `https://github.com/*/issues/*` page at `document_idle`.

It scans the DOM for two types of blocks:

1. **Issue title** — `h1.gh-header-title`
2. **Comments / issue body** — `.timeline-comment`, `.js-comment-container`

For each block found:

1. A `<div>` anchor is appended inside the block's header area (or the block itself).
2. A **Shadow DOM** is attached to the anchor to isolate styles.
3. A `<style>` element containing the compiled Tailwind CSS is injected into the shadow root.
4. React's `createRoot` mounts a `TranslateButton` component inside the shadow root.

A `MutationObserver` re-runs the scan (debounced 400 ms) whenever new nodes are added to `document.body`, handling lazy-loaded comments.

---

## Translation Flow (click → render)

```
User clicks TranslateButton
        │
        ▼
Read settings from chrome.storage.sync
(target language, backend URL)
        │
        ▼
Extract innerText from .comment-body
        │
        ▼
POST {text, targetLanguage} → backend /translate
        │
        ▼
Backend calls OpenAI GPT-4o-mini
System prompt instructs: translate to {language},
preserve markdown, code blocks, technical terms
        │
        ▼
Backend returns {translatedText}
        │
        ▼
Store original innerHTML in React state (cache)
Replace .comment-body content with translated text
Button state → "translated"
        │
        ▼
User clicks again
        │
        ▼
Restore original innerHTML from React state
Button state → "idle"
```

On subsequent toggles, the cached translation is used — no API call.

---

## Shadow DOM Usage

Each translate button lives in its own Shadow DOM:

```
.timeline-comment (GitHub element)
└── div[data-trans-id] (anchor, absolute positioned)
    └── #shadow-root (open)
        ├── <style>  ← compiled Tailwind CSS
        └── <div>    ← React mount point
            └── <TranslateButton />
```

**Why Shadow DOM:**
- GitHub's global CSS cannot bleed into button styles
- Extension styles cannot break GitHub's layout
- Complete visual isolation with zero class-name conflicts

---

## Settings Storage

Settings are persisted in `chrome.storage.sync`:

| Key | Default | Description |
|---|---|---|
| `targetLanguage` | `"Vietnamese"` | Language name passed to the AI |
| `backendUrl` | `"http://localhost:3000"` | Translation server base URL |

The content script caches settings in memory and invalidates on `chrome.storage.onChanged`.

---

## Backend API

Single endpoint:

```
POST /translate
Content-Type: application/json

{ "text": "...", "targetLanguage": "Vietnamese" }

→ 200 { "translatedText": "..." }
→ 400 { "error": "text and targetLanguage are required" }
→ 500 { "error": "..." }
```

CORS is open (`*`) since requests come from the `github.com` origin (content scripts run in the page context).
