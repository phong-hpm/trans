// queries.ts — GitHub Issues DOM selectors (update here when GitHub changes its markup)

export const githubQueries = {
  /** Matches issue detail pages: /owner/repo/issues/123 */
  pagePattern: /\/issues\/\d+/,

  /** h1 element wrapping the issue title and number */
  titleContainer: '[data-component="PH_Title"]',

  /** bdi element that holds the raw issue title text */
  titleText: '[data-component="PH_Title"] bdi.markdown-title',

  /** Outer block for the issue description (author header + body) */
  issueBody: 'div.react-issue-body',

  /** Scrollable content area inside the issue body */
  issueBodyViewer: '#issue-body-viewer',

  /** Each comment block in the timeline */
  commentBlock: '.react-issue-comment',

  /** Rendered markdown body — present in both issue body and comments */
  markdownBody: 'div.markdown-body',
} as const;

export const getTitleEl = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(githubQueries.titleText);

export const getTaskEl = (): HTMLElement | null =>
  document.querySelector<HTMLElement>(
    `${githubQueries.issueBodyViewer} ${githubQueries.markdownBody}`
  );
