// vite.config.ts — Vite build config for Chrome extension (MV3) via @crxjs/vite-plugin

import { defineConfig } from 'vite';
// import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

export default defineConfig({
  // Set root to src/ so dist output is flat — no src/ subfolder in dist
  // root: resolve(__dirname, 'src'),
  publicDir: false,
  build: {
    assetsInlineLimit: 1024 * 1024, // inline all assets as base64 — avoids chrome-extension:// URL issues in content scripts
  },
  plugins: [react(), crx({ manifest })],
});
