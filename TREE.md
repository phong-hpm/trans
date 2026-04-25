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
    ├── biome.json           — Biome lint + format config (replaces ESLint + Prettier)
    ├── public/
    │   └── manifest.json    — Chrome MV3 manifest; src paths resolved by crxjs at build time
    └── src/
        ├── declarations.d.ts            — Vite + Chrome type references
        ├── types.ts                     — Shared types: ExtensionSettings, TranslateRequest/Response
        ├── constants/
        │   ├── env.ts                   — ENV default export: { isDev, backendUrl } derived from import.meta.env
        │   ├── languages.ts             — LANGUAGES constant: supported target languages
        │   ├── providers.ts             — PROVIDERS list and MODELS map (provider → model options)
        │   └── settings.ts              — DEFAULT_SETTINGS; backendUrl, alwaysShowTranslated defaults
        ├── components/
        │   ├── Button.tsx               — Reusable button with primary, danger, and ghost variants
        │   ├── Input.tsx                — Reusable labeled text input component
        │   ├── Select.tsx               — Reusable labeled select component
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
        │   └── global.ts                — Zustand global store: flat settings + ready flag, init(), updateSettings(), patchSettings(), saveSettings()
        ├── content/
        │   ├── main.tsx                 — Entry: detectPlatform, init, MutationObserver, DEV logs
        │   ├── inject.tsx               — Generic injection engine: mounts TranslateButton per Block
        │   ├── toast.tsx                — Mounts Sonner <Toaster> into document.body
        │   ├── domSegments.ts           — Extract/apply/restore/getSegmentText for DOM text segments
        │   ├── translationCache.ts      — chrome.storage.local cache keyed by pathname:blockId
        │   ├── shadow.css               — Tailwind directives; imported via ?inline → injected into shadow roots
        │   ├── components/
        │   │   ├── TranslateButton.tsx  — Circle icon button used for title blocks
        │   │   ├── TranslatePopup.tsx   — Mode-selection dropdown (exports options + TranslateOption type)
        │   │   └── TranslateToolbar.tsx — Top-right toolbar for task/comment blocks: toggle + split translate button
        │   └── hooks/
        │       └── useTranslate.ts      — Translation state machine with cache lookup and useRef toggle
        └── popup/
            ├── index.html              — Popup HTML entry (crxjs resolves this from manifest action.default_popup)
            ├── index.tsx               — Popup entry point
            ├── popup.css              — Tailwind directives for popup UI
            └── Popup.tsx              — Settings form (target language, provider, model, toggles)
```

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
| Add new language options | `constants/languages.ts` |
| Change AI model or system prompt | `backend/src/providers/openai/` or `gemini/` |
| Add a new LLM provider | `backend/src/providers/` — implement `TranslationProvider`, register in `index.ts` |
| Add new API endpoints | `backend/src/server.ts` |
| Adjust Chrome permissions | `extension/public/manifest.json` |
| Change build config | `extension/vite.config.ts` |
