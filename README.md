# Task Translator

A Chrome extension that adds one-click translate buttons to every block in GitHub Issues (title, description, comments). Powered by GPT-4o-mini or Gemini via a local Node.js backend.

## Features

- Translate button on every block — always visible, no hover required
- Loading spinner while translating, error tooltip on failure
- Toggle between translated and original with one click
- Translations cached in session — no repeat API calls on toggle
- Configure target language and backend URL via the extension popup
- Supports multiple LLM providers: OpenAI and Gemini

## Setup

### Backend

```bash
cd backend
yarn install
cp .env.example .env
# Edit .env — set LLM_PROVIDER and the corresponding API key
yarn dev
```

The server starts on `http://localhost:8000` by default.

**LLM providers** — set `LLM_PROVIDER` in `.env`:

| Provider | Key | Default model |
|---|---|---|
| `openai` | `OPENAI_API_KEY` | `gpt-4o-mini` |
| `gemini` | `GEMINI_API_KEY` | `gemini-2.5-flash` |

### Extension

```bash
cd extension
yarn install
yarn build       # production build
# or
yarn dev         # watch mode for development
```

Then load in Chrome:

1. Open `chrome://extensions`
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `extension/dist` folder

### Configuration

Click the extension icon in Chrome's toolbar to open the popup:

- **Target Language** — language to translate into (default: Vietnamese)
- **Backend URL** — URL of the running translation server (default: `http://localhost:8000`)

> If your backend runs on a different host/port, update `host_permissions` in `extension/public/manifest.json` and rebuild.

## Project Structure

```
trans/
├── backend/          Node.js + Express translation server
└── extension/        Chrome Extension (MV3, React + TypeScript + Tailwind v3)
```

See [ARCHITECTURE.md](ARCHITECTURE.md) for a full technical breakdown.
