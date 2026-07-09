/// <reference types="vite/client" />

import type { SiteEditorApi } from '@shared/types';

declare global {
  interface Window {
    siteEditor: SiteEditorApi;
  }
}

export {};
