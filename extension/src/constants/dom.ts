// dom.ts — DOM ids and dataset keys used by extension-injected nodes

export const EXTENSION_DOM_PREFIX = 'task-translator';

export const ROOT_NODE_ID = `${EXTENSION_DOM_PREFIX}-global-ui`;
export const RUNTIME_NODE_ID = `${EXTENSION_DOM_PREFIX}-runtime`;

export const toDataAttr = (key: string): string =>
  `data-${key.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`)}`;

export const SHADOW_APP_HOST_STYLE =
  'position:absolute;top:0;left:0;width:0;height:0;z-index:999998;pointer-events:none;';
export const SHADOW_APP_ROOT_DATASET_KEY = 'taskTranslatorAppRoot';
export const SHADOW_APP_ROOT_SELECTOR = `[${toDataAttr(SHADOW_APP_ROOT_DATASET_KEY)}]`;

export const BLOCK_HOST_DATASET_KEY = 'taskTranslatorBlock';
export const BLOCK_HOST_SELECTOR = `[${toDataAttr(BLOCK_HOST_DATASET_KEY)}]`;

export const SEGMENT_ID_DATASET_KEY = 'taskTranslatorId';
export const SEGMENT_SELECTOR = `[${toDataAttr(SEGMENT_ID_DATASET_KEY)}]`;
export const getSegmentSelector = (id: string): string =>
  `[${toDataAttr(SEGMENT_ID_DATASET_KEY)}="${id}"]`;
