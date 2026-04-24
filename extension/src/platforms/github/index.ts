// index.ts — GitHub Issues platform adapter

import { getSegmentText } from '../../content/domSegments';
import type { ContextBlock } from '../../types';
import type { Block, PlatformAdapter } from '../types';
import { getTitleEl, getTaskEl, githubQueries as q } from './queries';

export const githubAdapter: PlatformAdapter = {
  pagePattern: q.pagePattern,

  getBlocks: (): Block[] => {
    const blocks: Block[] = [];

    // Issue title
    const titleContainer = document.querySelector<HTMLElement>(q.titleContainer);
    const titleContentEl = document.querySelector<HTMLElement>(q.titleText);
    if (titleContainer && titleContentEl) {
      blocks.push({
        blockId: 'issue-title',
        blockType: 'title',
        containerEl: titleContainer,
        contentEl: titleContentEl,
      });
    }

    // Issue body
    const issueBodyBlock = document.querySelector<HTMLElement>(q.issueBody);
    const bodyContentEl = document.querySelector<HTMLElement>(
      `${q.issueBodyViewer} ${q.markdownBody}`,
    );
    if (issueBodyBlock && bodyContentEl) {
      blocks.push({
        blockId: 'issue-body',
        blockType: 'task',
        containerEl: issueBodyBlock,
        contentEl: bodyContentEl,
        getContextBlocks: (): ContextBlock[] => {
          const titleEl = getTitleEl();
          if (!titleEl) return [];
          return [{ type: 'title', text: getSegmentText(titleEl) }];
        },
      });
    }

    // Comments
    const commentBlocks = Array.from(document.querySelectorAll(q.commentBlock));
    commentBlocks.forEach((block, i) => {
      const contentEl = block.querySelector<HTMLElement>(q.markdownBody);
      if (!contentEl) return;

      blocks.push({
        blockId: `comment-${i}`,
        blockType: 'comment',
        containerEl: block as HTMLElement,
        contentEl,
        getContextBlocks: (): ContextBlock[] => {
          const ctx: ContextBlock[] = [];
          const titleEl = getTitleEl();
          if (titleEl) ctx.push({ type: 'title', text: getSegmentText(titleEl) });
          const taskEl = getTaskEl();
          if (taskEl) ctx.push({ type: 'task', text: getSegmentText(taskEl) });
          commentBlocks.slice(0, i).forEach((b) => {
            const el = b.querySelector<HTMLElement>(q.markdownBody);
            if (el) ctx.push({ type: 'comment', text: getSegmentText(el) });
          });
          return ctx;
        },
      });
    });

    return blocks;
  },
};
