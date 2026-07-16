import { contextBridge, ipcRenderer } from 'electron';
import type {
  CatalogProduct,
  KnowledgeArticle,
  ProductType,
  SiteEditorApi,
} from '../shared/types';

const api: SiteEditorApi = {
  auth: {
    login: () => ipcRenderer.invoke('auth:login'),
    logout: () => ipcRenderer.invoke('auth:logout'),
    getStatus: () => ipcRenderer.invoke('auth:status'),
  },
  workspace: {
    sync: () => ipcRenderer.invoke('workspace:sync'),
    getPaths: () => ipcRenderer.invoke('workspace:paths'),
  },
  catalog: {
    load: () => ipcRenderer.invoke('catalog:load'),
    save: (product: CatalogProduct) => ipcRenderer.invoke('catalog:save', product),
    create: (product: CatalogProduct) => ipcRenderer.invoke('catalog:create', product),
    remove: (id: string, type: ProductType) => ipcRenderer.invoke('catalog:remove', id, type),
    reorder: (orderedIds: string[]) => ipcRenderer.invoke('catalog:reorder', orderedIds),
    reorderSolutions: (orderedIds: string[]) =>
      ipcRenderer.invoke('catalog:reorderSolutions', orderedIds),
  },
  knowledge: {
    load: () => ipcRenderer.invoke('knowledge:load'),
    save: (article: KnowledgeArticle) => ipcRenderer.invoke('knowledge:save', article),
    create: (article: KnowledgeArticle) => ipcRenderer.invoke('knowledge:create', article),
    remove: (id: string) => ipcRenderer.invoke('knowledge:remove', id),
  },
  images: {
    pickAndSave: (productId, slot, options) =>
      ipcRenderer.invoke('images:pick', productId, slot, options),
    saveFromPaths: (productId, filePaths, slot, kind) =>
      ipcRenderer.invoke('images:savePaths', productId, filePaths, slot, kind),
    getPreviewUrl: (relativePath) => ipcRenderer.invoke('images:preview', relativePath),
    listForProduct: (productId, kind) => ipcRenderer.invoke('images:list', productId, kind),
    remove: (relativePath) => ipcRenderer.invoke('images:delete', relativePath),
  },
  publish: {
    run: (commitMessage) => ipcRenderer.invoke('publish:run', commitMessage),
    getDirtyFiles: () => ipcRenderer.invoke('publish:dirty'),
  },
};

contextBridge.exposeInMainWorld('siteEditor', api);
