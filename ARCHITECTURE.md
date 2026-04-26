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

---

## History API (Backend)

```
GET    /api/v1/history/:pageId/:blockId   → 200 BlockHistory | 404
PUT    /api/v1/history/:pageId/:blockId   body: { entries } → 200
DELETE /api/v1/history/:pageId/:blockId   → 200
GET    /api/v1/history/:pageId            → 200 BlockHistory[]
DELETE /api/v1/history/:pageId            → 200
GET    /api/v1/history                    → 200 BlockHistory[]
DELETE /api/v1/history                    → 200
```

`pageId` and `blockId` are URL-encoded in the path (pageId is a URL pathname like `/owner/repo/issues/1`).

Backend stores data in `backend/src/db/db.json` as a mock MongoDB collection.
Swap `backend/src/db/index.ts` read/write functions to connect to real MongoDB.

---

## chrome.storage.local — Data Flow

Translation history is stored in `chrome.storage.local` with the key format:

```
trans:{pageId}:{blockId}
```

Where `pageId = location.pathname` (e.g. `/owner/repo/issues/42`) and `blockId` is a stable DOM identifier assigned per block.

### Storage key internals

Storage keys are private to `historyApi.ts` — no other file constructs or parses them.
All reads/writes go through the API functions:

| Function | Storage op | Description |
|---|---|---|
| `getBlockHistoryApi(blockId, pageId)` | `storage.local.get` | Load one block's history |
| `saveBlockHistoryApi(history)` | `storage.local.set` | Persist updated history |
| `deleteBlockHistoryApi(blockId, pageId)` | `storage.local.remove` | Remove a block's history |
| `getAllHistoriesApi(pageId)` | `storage.local.get(null)` | Load all blocks for a page |
| `clearPageHistoriesApi(pageId)` | `storage.local.remove` (batch) | Delete all blocks for a page |
| `clearAllHistoriesApi()` | `storage.local.clear` | Wipe everything |
| `subscribeHistoryChangesApi(listener)` | `storage.onChanged` | Live-update on any change |

### Action-by-action data flow

**1. User clicks Translate**
```
useTranslate.translate()
  → extractSegments(el)              reads DOM text nodes
  → getSelectedEntry(blockId)        reads chrome.storage.local
    hit  → applyFromEntry()          applies saved translation to DOM
    miss → callApi()                 POSTs to backend via background worker
         → addTranslationEntry()     [translationSync.ts]
           → translationHistory.ts   saves to chrome.storage.local
           → dbHistoryApi.ts         (if syncToDb ON) PUTs to backend REST API
```

**2. User clicks Retranslate**
```
useTranslate.retranslate()
  → callApi()                        always hits backend (bypasses saved history)
  → addTranslationEntry()            saves new entry to local + optionally DB
```

**3. User selects a history entry (Sidebar)**
```
BlockCollapse → selectEntry(blockId, entryId)   [translationSync.ts]
  → translationHistory.selectEntry()            flips `selected` flag in local storage
  → subscribeHistoryChangesApi listener fires   in useTranslate
    → applyFromEntry(selected)                  re-applies the chosen translation to DOM
  → dbHistoryApi.saveBlockHistoryDbApi()        (if syncToDb ON) syncs to backend
```

**4. User deletes a history entry**
```
BlockCollapse → deleteEntry(blockId, entryId)   [translationSync.ts]
  → translationHistory.deleteEntry()            removes entry, auto-selects newest remaining
    entries remain → saveBlockHistoryApi()      updates local storage
    no entries left → deleteBlockHistoryApi()   removes the key from local storage
  → subscribeHistoryChangesApi listener fires
    no entries → restore DOM to original text
  → dbHistoryApi (if syncToDb ON)               saves or deletes from backend
```

**5. Clear page / Clear all (Control Panel)**
```
PagePanel → clearPageHistoriesApi(pathname)     removes all keys matching trans:{pageId}:*
StoragePanel → clearAllHistoriesApi()           chrome.storage.local.clear()
  → subscribeHistoryChangesApi listener fires for each removed key
    → useTranslate restores DOM for each affected block
```

**6. Live sync across tabs (same page open in multiple tabs)**
```
Tab A: saves a new entry → chrome.storage.local.set
Tab B: subscribeHistoryChangesApi fires automatically (chrome.storage.onChanged is cross-tab)
     → useTranslate in Tab B re-applies the latest selected entry
```

### DB sync layer (translationSync.ts)

When `syncToDb` is ON in settings, `translationSync.ts` fires DB API calls **after** every successful local write. DB failures are silent and non-fatal — `chrome.storage.local` remains the source of truth at all times.

```
translationSync.ts
  ├── reads from  → translationHistory.ts → historyApi.ts → chrome.storage.local
  └── writes to   → translationHistory.ts (always)
                  → dbHistoryApi.ts       (only when syncToDb = true)
```
