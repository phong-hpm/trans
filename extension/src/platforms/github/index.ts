// index.ts — GitHub Issues platform adapter

import { getSegmentTextDom } from '../../content/dom/segmentsDom';
import { BlockTypeEnum } from '../../enums';
import type { ContextBlock } from '../../types';
import type { Block, PlatformAdapter } from '../types';
import { getTaskEl, getTitleEl, githubQueries as q } from './queries';

export const githubAdapter: PlatformAdapter = {
  name: 'GitHub',
  pagePattern: q.pagePattern,

  getBlocks: (): Block[] => {
    const blocks: Block[] = [];

    // Issue title
    const titleContainer = document.querySelector<HTMLElement>(q.titleContainer);
    const titleContentEl = document.querySelector<HTMLElement>(q.titleText);
    if (titleContainer && titleContentEl) {
      blocks.push({
        blockType: BlockTypeEnum.Title,
        containerEl: titleContainer,
        contentEl: titleContentEl,
        getLiveElement: () => document.querySelector<HTMLElement>(q.titleText),
      });
    }

    // Issue body
    const issueBodyBlock = document.querySelector<HTMLElement>(q.issueBody);
    const bodyContentEl = document.querySelector<HTMLElement>(
      `${q.issueBodyViewer} ${q.markdownBody}`
    );
    if (issueBodyBlock && bodyContentEl) {
      blocks.push({
        blockType: BlockTypeEnum.Task,
        containerEl: issueBodyBlock,
        contentEl: bodyContentEl,
        getLiveElement: () =>
          document.querySelector<HTMLElement>(`${q.issueBodyViewer} ${q.markdownBody}`),
        getContextBlocks: (): ContextBlock[] => {
          const titleEl = getTitleEl();
          if (!titleEl) return [];
          return [{ type: BlockTypeEnum.Title, text: getSegmentTextDom(titleEl) }];
        },
      });
    }

    // Comments
    const commentBlocks = Array.from(document.querySelectorAll(q.commentBlock));
    commentBlocks.forEach((block) => {
      const contentEl = block.querySelector<HTMLElement>(q.markdownBody);
      if (!contentEl) return;

      const commentEl = block as HTMLElement;
      blocks.push({
        blockType: BlockTypeEnum.Comment,
        containerEl: commentEl,
        contentEl,
        // Re-query within the stable comment container in case markdown-body is replaced
        getLiveElement: () => commentEl.querySelector<HTMLElement>(q.markdownBody),
        getContextBlocks: (): ContextBlock[] => {
          const ctx: ContextBlock[] = [];
          const titleEl = getTitleEl();
          if (titleEl) ctx.push({ type: BlockTypeEnum.Title, text: getSegmentTextDom(titleEl) });
          const taskEl = getTaskEl();
          if (taskEl) ctx.push({ type: BlockTypeEnum.Task, text: getSegmentTextDom(taskEl) });
          // Re-query at call time so context includes comments added after getBlocks() ran
          const liveCommentBlocks = Array.from(document.querySelectorAll(q.commentBlock));
          const myIndex = liveCommentBlocks.indexOf(commentEl);
          const preceding = myIndex >= 0 ? liveCommentBlocks.slice(0, myIndex) : [];
          preceding.forEach((b) => {
            const el = b.querySelector<HTMLElement>(q.markdownBody);
            if (el) ctx.push({ type: BlockTypeEnum.Comment, text: getSegmentTextDom(el) });
          });
          return ctx;
        },
      });
    });

    return blocks;
  },
};
