// index.ts — Platform registry: maps URLs to their adapter

import { githubAdapter } from './github';
import type { PlatformAdapter } from './types';

const PLATFORMS: PlatformAdapter[] = [githubAdapter];

export const detectPlatform = (url: string): PlatformAdapter | null =>
  PLATFORMS.find((p) => p.pagePattern.test(url)) ?? null;
