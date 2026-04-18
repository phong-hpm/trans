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
│   ├── .env.example         — Environment variable template (OPENAI_API_KEY, PORT, MODEL)
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       └── server.ts        — Express server with POST /translate endpoint (OpenAI SDK)
│
└── extension/
    ├── .gitignore
    ├── package.json
    ├── postcss.config.js    — PostCSS config (Tailwind + autoprefixer); picked up by Vite automatically
    ├── tailwind.config.js   — Tailwind v3 JIT config, scans src/**
    ├── tsconfig.json        — Modern config: moduleResolution Bundler, isolatedModules, noEmit
    ├── vite.config.ts       — Vite + @crxjs/vite-plugin; publicDir disabled to avoid manifest conflict
    ├── public/
    │   └── manifest.json    — Chrome MV3 manifest; src paths resolved by crxjs at build time
    └── src/
        ├── declarations.d.ts            — /// <reference types="vite/client" /> (covers ?inline, assets)
        ├── types.ts                     — Shared types: ExtensionSettings, TranslateRequest/Response
        ├── content/
        │   ├── content-script.tsx       — Entry: scans GitHub DOM, injects shadow hosts, MutationObserver
        │   ├── TranslateButton.tsx      — React button component (idle/loading/translated/error states)
        │   └── shadow.css              — Tailwind directives; imported via ?inline → injected into shadow roots
        └── popup/
            ├── index.html              — Popup HTML entry (crxjs resolves this from manifest action.default_popup)
            ├── index.tsx               — Popup entry point
            ├── popup.css              — Tailwind directives for popup UI
            └── Popup.tsx              — Settings form (target language, backend URL)
```

## Key files to edit for common tasks

| Task | File(s) |
|---|---|
| Change which GitHub elements get a button | `content/content-script.tsx` — `injectIntoComment`, `injectIntoTitle` |
| Change button appearance / states | `content/TranslateButton.tsx` |
| Change how translation text is rendered | `content/content-script.tsx` — `onTranslate` callback |
| Add new language options | `popup/Popup.tsx` — `LANGUAGES` array |
| Change AI model or system prompt | `backend/src/server.ts` |
| Add new API endpoints | `backend/src/server.ts` |
| Adjust Chrome permissions | `extension/public/manifest.json` |
| Change build config | `extension/vite.config.ts` |
