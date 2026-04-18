// github-query.ts — GitHub Issues DOM selectors (update here when GitHub changes its markup)

export const githubIssueQueries = {
  /** Matches issue detail pages: /owner/repo/issues/123 */
  pagePattern: /\/issues\/\d+/,

  /** h1 element wrapping the issue title and number */
  titleContainer: '[data-component="PH_Title"]',

  /** bdi element that holds the raw issue title text */
  titleText: '[data-testid="issue-title"]',

  /** Outer block for the issue description (author header + body) */
  issueBody: '[data-testid="issue-body"]',

  /** Scrollable content area inside the issue body */
  issueBodyViewer: '[data-testid="issue-body-viewer"]',

  /** Each comment block in the timeline */
  commentBlock: '.react-issue-comment',

  /** Header bar of a comment — contains author, timestamp, and action buttons */
  commentHeader: '[data-testid="comment-header"]',

  /** Right-side actions container inside the comment header — best anchor for the button */
  commentHeaderActions: '[data-testid="comment-header-right-side-items"]',

  /** Rendered markdown body — present in both issue body and comments */
  markdownBody: '[data-testid="markdown-body"]',
} as const;
