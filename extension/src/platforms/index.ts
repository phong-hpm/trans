// index.ts — Platform registry: maps URLs to their adapter

import { GitHubPlatformAdapter } from './github';
import type { PlatformAdapter } from './types';

const adapterInstances: PlatformAdapter[] = [new GitHubPlatformAdapter()];

export const getPlatformAdapter = (url: string): PlatformAdapter | null =>
  adapterInstances.find((p) => p.pagePattern.test(url)) ?? null;
