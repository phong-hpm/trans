// vite.config.ts — Vite build config for Chrome extension (MV3) via @crxjs/vite-plugin

import { crx } from '@crxjs/vite-plugin';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import manifest from './public/manifest.json';

export default defineConfig({
  publicDir: false,
  build: {
    assetsInlineLimit: 1024 * 1024, // inline all assets as base64 — avoids chrome-extension:// URL issues in content scripts
  },
  plugins: [react(), crx({ manifest })],
});
