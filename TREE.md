# Project Tree

Generated on 2026-04-18. Excludes `node_modules/`, `dist/`, `.git/`.

```
trans/
├── ARCHITECTURE.md          — Full technical breakdown: injection flow, Shadow DOM, API
├── CLAUDE.md                — Project rules (comments in English, file headers, docs language)
├── README.md                — Setup and usage guide
├── TREE.md                  — This file
│
├── backend/
│   ├── .env.example         — Environment variable template (LLM_PROVIDER, OPENAI_API_KEY, GEMINI_API_KEY, PORT)
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── server.ts        — Express server with POST /translate endpoint
│       └── providers/
│           ├── index.ts     — Factory: createProvider() reads LLM_PROVIDER env var
│           ├── types.ts     — TranslationProvider interface + buildSystemPrompt helper
│           ├── openai.ts    — OpenAI provider implementation
│           └── gemini.ts    — Gemini provider implementation
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
        │   ├── env.ts                   — ENV default export: { isDev } derived from import.meta.env
        │   ├── github-query.ts          — All GitHub DOM selectors (data-testid, class-based)
        │   └── settings.ts              — DEFAULT_SETTINGS; backendUrl auto-set to localhost in DEV mode
        ├── background/
        │   ├── background.ts            — Service worker CORS proxy: relays /translate requests
        │   └── logger.ts               — Grouped request logger; relays to page DevTools in DEV mode
        ├── content/
        │   ├── content-script.tsx       — Entry: init, MutationObserver, DEV log listener
        │   ├── inject.tsx               — Shadow DOM mounting + block injection (title, body, comments)
        │   ├── settings.ts              — Settings cache singleton (chrome.storage.sync)
        │   ├── toast.tsx                — Mounts Sonner <Toaster> into document.body
        │   ├── domSegments.ts           — Extract/apply/restore text segments via TreeWalker
        │   ├── translationCache.ts      — chrome.storage.local cache keyed by pathname:blockId
        │   ├── shadow.css               — Tailwind directives; imported via ?inline → injected into shadow roots
        │   ├── components/
        │   │   └── TranslateButton.tsx  — Translate/restore toggle button (lucide-react icons)
        │   └── hooks/
        │       └── useTranslate.ts      — Translation state machine with cache lookup and useRef toggle
        └── popup/
            ├── index.html              — Popup HTML entry (crxjs resolves this from manifest action.default_popup)
            ├── index.tsx               — Popup entry point
            ├── popup.css              — Tailwind directives for popup UI
            └── Popup.tsx              — Settings form (target language, backend URL)
```

## Key files to edit for common tasks

| Task | File(s) |
|---|---|
| Change which GitHub elements get a button | `content/inject.tsx` — `injectIntoComment`, `injectIntoTitle` |
| Change button appearance / states | `content/components/TranslateButton.tsx` |
| Change translation logic / error handling | `content/hooks/useTranslate.ts` |
| Change how translation text is rendered | `content/inject.tsx` — `onTranslate` callback |
| Add new language options | `popup/Popup.tsx` — `LANGUAGES` array |
| Change AI model or system prompt | `backend/src/providers/openai.ts` or `gemini.ts` |
| Add a new LLM provider | `backend/src/providers/` — implement `TranslationProvider`, register in `index.ts` |
| Add new API endpoints | `backend/src/server.ts` |
| Adjust Chrome permissions | `extension/public/manifest.json` |
| Change build config | `extension/vite.config.ts` |
