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
  },
  knowledge: {
    load: () => ipcRenderer.invoke('knowledge:load'),
    save: (article: KnowledgeArticle) => ipcRenderer.invoke('knowledge:save', article),
    create: (article: KnowledgeArticle) => ipcRenderer.invoke('knowledge:create', article),
    remove: (id: string) => ipcRenderer.invoke('knowledge:remove', id),
  },
  images: {
    pickAndSave: (productId, slot) => ipcRenderer.invoke('images:pick', productId, slot),
    getPreviewUrl: (relativePath) => ipcRenderer.invoke('images:preview', relativePath),
    listForProduct: (productId) => ipcRenderer.invoke('images:list', productId),
  },
  publish: {
    run: (commitMessage) => ipcRenderer.invoke('publish:run', commitMessage),
    getDirtyFiles: () => ipcRenderer.invoke('publish:dirty'),
  },
};

contextBridge.exposeInMainWorld('siteEditor', api);
