// index.ts — GitHub Issues platform adapter

import { PlatformDomTextReader } from '../../content/dom/PlatformDomTextReader';
import { BlockTypeEnum } from '../../enums';
import type { ContextBlock } from '../../types';
import type { PlatformAdapter, PlatformBlock } from '../types';
import { getTaskEl, getTitleEl, githubQueries as q } from './queries';

export class GitHubPlatformAdapter implements PlatformAdapter {
  name = 'GitHub';
  pagePattern = q.pagePattern;

  getBlocks = (): PlatformBlock[] => [...this.getTaskBlocks(), ...this.getCommentBlocks()];

  private getTaskBlocks = (): PlatformBlock[] => {
    const issueBodyBlock = document.querySelector<HTMLElement>(q.issueBody);
    const bodyContentEl = document.querySelector<HTMLElement>(
      `${q.issueBodyViewer} ${q.markdownBody}`
    );
    const titleContentEl = document.querySelector<HTMLElement>(q.titleText);

    if (!issueBodyBlock || !bodyContentEl) return [];

    return [
      {
        blockType: BlockTypeEnum.Task,
        containerEl: issueBodyBlock,
        contentEl: bodyContentEl,
        attachedContentEls: titleContentEl ? [titleContentEl] : [],
        getLiveElement: () =>
          document.querySelector<HTMLElement>(`${q.issueBodyViewer} ${q.markdownBody}`),
        getLiveAttachedElements: () => {
          const titleEl = getTitleEl();
          return titleEl ? [titleEl] : [];
        },
        getContextBlocks: (): ContextBlock[] => [],
      },
    ];
  };

  private getCommentBlocks = (): PlatformBlock[] => {
    const commentEls = Array.from(document.querySelectorAll<HTMLElement>(q.commentBlock));

    return commentEls.flatMap((commentEl) => {
      const contentEl = commentEl.querySelector<HTMLElement>(q.markdownBody);
      if (!contentEl) return [];

      return [
        {
          blockType: BlockTypeEnum.Comment,
          containerEl: commentEl,
          contentEl,
          getLiveElement: () => commentEl.querySelector<HTMLElement>(q.markdownBody),
          getContextBlocks: () => this.getCommentContextBlocks(commentEl),
        },
      ];
    });
  };

  private getCommentContextBlocks = (commentEl: HTMLElement): ContextBlock[] => {
    const ctx: ContextBlock[] = [];
    const platformDomTextReader = new PlatformDomTextReader();

    const titleContextBlock = this.getTitleContextBlock(platformDomTextReader);
    if (titleContextBlock) ctx.push(titleContextBlock);

    const taskContextBlock = this.getTaskContextBlock(platformDomTextReader);
    if (taskContextBlock) ctx.push(taskContextBlock);

    // Re-query at call time so context includes comments added after getBlocks() ran
    const liveCommentEls = Array.from(document.querySelectorAll<HTMLElement>(q.commentBlock));
    const myIndex = liveCommentEls.indexOf(commentEl);
    const preceding = myIndex >= 0 ? liveCommentEls.slice(0, myIndex) : [];

    preceding.forEach((precedingEl) => {
      const el = precedingEl.querySelector<HTMLElement>(q.markdownBody);
      if (el) {
        ctx.push({ type: BlockTypeEnum.Comment, text: platformDomTextReader.getSourceText(el) });
      }
    });

    return ctx;
  };

  private getTitleContextBlock = (
    platformDomTextReader: PlatformDomTextReader
  ): ContextBlock | null => {
    const titleEl = getTitleEl();
    if (!titleEl) return null;
    return { type: BlockTypeEnum.Title, text: platformDomTextReader.getSourceText(titleEl) };
  };

  private getTaskContextBlock = (
    platformDomTextReader: PlatformDomTextReader
  ): ContextBlock | null => {
    const taskEl = getTaskEl();
    if (!taskEl) return null;
    return { type: BlockTypeEnum.Task, text: platformDomTextReader.getSourceText(taskEl) };
  };
}
