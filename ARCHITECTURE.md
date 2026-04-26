# Architecture

## Overview

Monorepo with two packages:

| Package | Stack |
|---|---|
| `backend/` | Node.js, Express, TypeScript, OpenAI SDK |
| `extension/` | Chrome MV3, React 18, TypeScript, Tailwind v3, Shadow DOM |

---

## Multi-Platform Design

The extension is built around a **platform adapter** pattern so new issue trackers can be added without touching the injection engine.

```
src/platforms/
  types.ts          — Block + PlatformAdapter interfaces
  index.ts          — PLATFORMS registry + detectPlatform(url)
  github/
    queries.ts      — GitHub DOM selectors + getTitleEl / getTaskEl helpers
    index.ts        — GitHub adapter (implements PlatformAdapter)
```

### Adding a new platform

1. Create `src/platforms/<name>/queries.ts` — DOM selectors for that site
2. Create `src/platforms/<name>/index.ts` — implement `PlatformAdapter` (`pagePattern` + `getBlocks`)
3. Register the adapter in `src/platforms/index.ts` → `PLATFORMS` array
4. Add the domain to `host_permissions` and `content_scripts.matches` in `manifest.json`

### PlatformAdapter interface

```ts
interface Block {
  blockId: string;
  blockType: BlockType;           // 'title' | 'task' | 'comment'
  containerEl: HTMLElement;       // parent for the anchor div
  contentEl: HTMLElement;         // element whose text gets translated
  getContextBlocks?: () => ContextBlock[];
}

interface PlatformAdapter {
  pagePattern: RegExp;            // matched against location.href
  getBlocks: () => Block[];       // called on init + every MutationObserver tick
}
```

---

## Injection Flow

`content-script.tsx` runs at `document_idle`. It calls `detectPlatform(location.href)` — if a matching adapter is found, `init(platform)` runs:

1. Retry loop (10 × 500 ms) calls `processBlocks(platform.getBlocks())` to handle async renders
2. `MutationObserver` (debounced 400 ms) re-calls `processBlocks` on DOM changes

For each `Block` returned by the adapter, `inject.tsx`:

1. Appends a `<div>` anchor to `block.containerEl` (absolutely positioned)
2. Attaches a **Shadow DOM** to isolate styles from the host page
3. Injects compiled Tailwind CSS into the shadow root
4. Mounts `<TranslateButton>` via React `createRoot`

---

## Translation Flow (click → render)

```
User clicks TranslateButton
        │
        ▼
Check chrome.storage.local for saved translation
        │
   hit ─┤─ miss
        │         │
        │         ▼
        │   Read settings (chrome.storage.sync)
        │   Extract text segments via TreeWalker
        │   POST { segments, contextBlocks, targetLanguage, provider, model }
        │       → background service worker (CORS proxy)
        │       → backend /api/v1/translate
        │       → LLM provider (OpenAI / Gemini)
        │   Save result in chrome.storage.local
        │
        ▼
Apply translated text to DOM spans
Button state → "translated"
        │
        ▼
User clicks again → restore original text → "idle"
```

---

## Shadow DOM Usage

```
.issue-block (platform element)
└── div[data-trans-id] (anchor, absolute positioned)
    └── #shadow-root (open)
        ├── <style>  ← compiled Tailwind CSS
        └── <div>    ← React mount point
            └── <TranslateButton />
```

**Why Shadow DOM:**
- Host page CSS cannot bleed into button styles
- Extension styles cannot break the host page layout
- Complete visual isolation with zero class-name conflicts

---

## Settings Storage

Settings are persisted in `chrome.storage.sync`:

| Key | Default | Description |
|---|---|---|
| `targetLanguage` | `"Vietnamese"` | Language name passed to the AI |
| `backendUrl` | `""` | Translation server base URL |
| `provider` | `"openai"` | LLM provider |
| `model` | `"gpt-4o-mini"` | Model name |
| `alwaysShowTranslated` | `false` | Auto-apply saved translations on page load |

---

## Backend API

```
POST /api/v1/translate
Content-Type: application/json

{
  "blockType": "comment",
  "segments": [{ "id": "abc123", "text": "..." }],
  "contextBlocks": [{ "type": "title", "text": "..." }],
  "targetLanguage": "Vietnamese",
  "provider": "openai",
  "model": "gpt-4o-mini"
}

→ 200 { "segments": [{ "id": "abc123", "text": "...", "translatedText": "..." }] }
→ 400 { "error": "..." }
→ 500 { "error": "..." }
```
