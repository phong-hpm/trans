# Project Tree

Generated on 2026-04-24. Excludes `node_modules/`, `dist/`, `.git/`.

```
trans/
├── ARCHITECTURE.md          — Full technical breakdown: injection flow, Shadow DOM, API
├── CLAUDE.md                — Project rules (comments in English, file headers, docs language)
├── README.md                — Setup and usage guide
├── TREE.md                  — This file
│
├── backend/
│   ├── .env.example         — Environment variable template (OPENAI_API_KEY, GEMINI_API_KEY, PORT)
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json        — Includes @/ path alias pointing to src/
│   └── src/
│       ├── server.ts        — Express app setup, mounts /api router
│       ├── types.ts         — Shared API types: TranslateSegment, TranslateRequest, TranslatedSegment
│       ├── lib/
│       │   └── logger.ts            — Chalk-coloured request/response/error logger (Logger class)
│       ├── routes/
│       │   ├── index.ts     — Root router: mounts /v1
│       │   └── v1/
│       │       └── translate.route.ts — POST /api/v1/translate
│       ├── controllers/
│       │   └── translate.controller.ts — Validates request, delegates to service
│       ├── services/
│       │   └── translate.service.ts   — Calls provider, merges original text into response
│       └── providers/
│           ├── types.ts     — TranslationProvider interface
│           ├── index.ts     — Provider registry (lookup by name)
│           ├── openai/
│           │   ├── index.ts — OpenAI provider (lazy client init)
│           │   └── prompt.ts — GPT-optimised system prompt
│           └── gemini/
│               ├── index.ts — Gemini provider (lazy client init)
│               └── prompt.ts — Gemini-optimised system prompt
│
└── extension/
    ├── .gitignore
    ├── package.json
    ├── postcss.config.js    — PostCSS config (Tailwind + autoprefixer); picked up by Vite automatically
    ├── tailwind.config.js   — Tailwind v3 JIT config, scans src/**
    ├── tsconfig.json        — Modern config: moduleResolution Bundler, isolatedModules, noEmit
    ├── vite.config.ts       — Vite + @crxjs/vite-plugin; publicDir disabled to avoid manifest conflict
    ├── eslint.config.mjs    — ESLint flat config with TypeScript + React plugins
    ├── .prettierrc          — Prettier formatting config (singleQuote, trailingComma, printWidth 100)
    ├── public/
    │   └── manifest.json    — Chrome MV3 manifest; src paths resolved by crxjs at build time
    └── src/
        ├── declarations.d.ts            — Vite + Chrome type references
        ├── enums.ts                     — All enum definitions: MessageTypeEnum, LogTypeEnum, BlockTypeEnum, ThemeEnum, SidebarModeEnum, SidebarTabEnum, TranslateStateEnum, ProviderEnum, ModelEnum
        ├── types.ts                     — Shared interfaces: ExtensionSettings, TranslateRequest/Response, BlockHistory, TranslationEntry
        ├── apis/
        │   ├── cacheApi.ts              — Abstraction over chrome.storage.local (fetchCacheItemApi, saveCacheItemApi, deleteCacheItemApi, fetchAllCacheItemsApi, fetchCacheUsageApi, getCacheQuotaApi, onCacheChangedApi)
        │   └── syncApi.ts               — Abstraction over chrome.storage.sync (fetchSettingsApi, saveSettingsApi, onSettingsChangedApi)
        ├── constants/
        │   ├── env.ts                   — ENV default export: { isDev, backendUrl } derived from import.meta.env
        │   ├── languages.ts             — LANGUAGES constant: supported target languages
        │   ├── providers.ts             — PROVIDERS list and MODELS map (provider → model options)
        │   └── settings.ts              — DEFAULT_SETTINGS; backendUrl, alwaysShowTranslated defaults
        ├── components/
        │   ├── Button.tsx               — Reusable button (variant: contain|outline, color: primary|danger|ghost); also exports ConfirmButton (two-step confirm flow)
        │   ├── Confirm.tsx              — Shared inline Confirm / Cancel action row
        │   ├── IconButton.tsx           — Icon-only button (variant: contain|outline, color: primary|danger|ghost); also exports ConfirmIconButton (X/Check two-step confirm)
        │   ├── Input.tsx                — Reusable labeled text input component
        │   ├── Modal.tsx                — Generic modal shell: backdrop + rounded card with header and body slot
        │   ├── Select.tsx               — Reusable labeled select component
        │   ├── TextareaInput.tsx        — Reusable labeled textarea with optional help text
        │   ├── ThemeWrapper.tsx         — Wraps children with current theme class for dark mode support
        │   └── Toggle.tsx               — Reusable toggle switch component with label/sublabel
        ├── platforms/
        │   ├── types.ts                 — Block + PlatformAdapter interfaces
        │   ├── index.ts                 — PLATFORMS registry + detectPlatform(url)
        │   └── github/
        │       ├── queries.ts           — GitHub DOM selectors + getTitleEl / getTaskEl helpers
        │       └── index.ts             — GitHub Issues platform adapter
        ├── background/
        │   ├── background.ts            — Service worker CORS proxy: relays /translate requests
        │   └── logger.ts               — Grouped request logger; relays to page DevTools in DEV mode
        ├── store/
        │   └── global.ts                — Zustand global store: flat settings + ready flag + sidebar state, init(), updateSettings() (auto-saves), openSidebarToBlock(), clearFocusedBlock()
        ├── content/
        │   ├── main.tsx                 — Entry: detectPlatform, init, MutationObserver, DEV logs
        │   ├── inject.tsx               — Generic injection engine: mounts TranslateButton per Block
        │   ├── toast.tsx                — Mounts Sonner <Toaster> into document.body
        │   ├── sidebar.tsx              — Mounts Sidebar into document.body via shadow DOM
        │   ├── modal.tsx                — Mounts Modal into document.body via shadow DOM
        │   ├── domSegments.ts           — Extract/apply/restore/getSegmentText for DOM text segments
        │   ├── translationHistory.ts    — Block translation history CRUD: addTranslationEntry, selectEntry, deleteEntry
        │   ├── shadow.css               — Tailwind directives; imported via ?inline → injected into shadow roots
        │   ├── components/
        │   │   ├── TranslateButton.tsx  — Circle icon button used for title blocks; uses BlockTypeEnum
        │   │   ├── TranslatePopup.tsx   — Mode-selection dropdown portalled into shadow root; uses ThemeWrapper
        │   │   ├── TranslateToolbar.tsx — Top-right toolbar for task/comment blocks: toggle + split translate + IconButton(retranslate) + Button(history); uses ThemeWrapper
        │   │   ├── translateOptions.ts  — COMMENT_OPTIONS, SIMPLE_OPTIONS, TranslateOption type shared between Popup and Toolbar
        │   │   ├── ControlPanel/
        │   │   │   ├── index.tsx        — Nav shell: Settings | Provider | Page | Storage
        │   │   │   ├── SettingsPanel.tsx — Language select + display toggles
        │   │   │   ├── ProviderPanel.tsx — Provider/model selects + user context textarea
        │   │   │   ├── PagePanel.tsx    — Platform info + clear page history
        │   │   │   └── StoragePanel.tsx — Storage usage bar + clear all history
        │   │   └── Sidebar/
        │   │       ├── index.tsx        — Main sidebar shell: drawer/page modes (isDrawerMode), updateSettings(); uses ThemeWrapper
        │   │       ├── Tabs.tsx         — Generic bottom-border tab bar component
        │   │       ├── HistoryTab.tsx   — History tab: lists all block histories, focuses on openSidebarToBlock target
        │   │       └── BlockCollapse.tsx — Collapsible block entry with translation entries, select + ConfirmIconButton delete
        │   └── hooks/
        │       ├── useTranslate.ts      — Translation state machine with history-aware cache, retranslate, selectHistoryEntry, deleteHistoryEntry
        │       └── useBlockHistories.ts — Load and subscribe to all block histories for current page
        └── popup/
            ├── index.html              — Popup HTML entry (crxjs resolves this from manifest action.default_popup)
            ├── index.tsx               — Popup entry point
            ├── popup.css              — Tailwind directives for popup UI
            └── Popup.tsx              — Settings form (language, provider, model, toggles, ConfirmButton for history clear); uses ThemeWrapper + updateSettings()
```

# To delete: rm -rf extension/src/content/components/Modal
# To delete: rm extension/src/constants/github-query.ts
# To delete: rm extension/src/content/settings.ts
# To delete: rm extension/src/content/hooks/useTheme.ts
# To delete: rm extension/src/store/index.ts

## Key files to edit for common tasks

| Task | File(s) |
|---|---|
| Add support for a new platform | `platforms/<name>/` — implement `PlatformAdapter`, register in `platforms/index.ts` |
| Change which elements get a button (GitHub) | `platforms/github/index.ts` — `getBlocks` |
| Change button appearance / states | `content/components/TranslateButton.tsx` |
| Change translation logic / error handling | `content/hooks/useTranslate.ts` |
| Change sidebar appearance / layout | `content/components/Sidebar/index.tsx` |
| Change history entry display | `content/components/Sidebar/BlockCollapse.tsx` |
| Add new language options | `constants/languages.ts` |
| Change AI model or system prompt | `backend/src/providers/openai/` or `gemini/` |
| Add a new LLM provider | `backend/src/providers/` — implement `TranslationProvider`, register in `index.ts` |
| Add new API endpoints | `backend/src/server.ts` |
| Adjust Chrome permissions | `extension/public/manifest.json` |
| Change build config | `extension/vite.config.ts` |
