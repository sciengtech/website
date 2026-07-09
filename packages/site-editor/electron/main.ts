import './env';
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { registerAssetProtocolHandler, registerAssetProtocolScheme } from './asset-protocol';

registerAssetProtocolScheme();
import { join } from 'path';
import {
  getAuthStatus,
  loginWithGitHub,
  logout,
} from './github-auth';
import { getWorkspacePaths, syncWorkspace } from './workspace';
import {
  createArticle,
  createProduct,
  loadCatalog,
  loadKnowledge,
  removeArticle,
  removeProduct,
  saveArticle,
  saveProduct,
} from './data-service';
import {
  getPreviewFileUrl,
  listProductImages,
  pickAndSaveImage,
} from './image-service';
import { getDirtySourceFiles, publishChanges } from './publish';
import type { CatalogProduct, KnowledgeArticle, ProductType } from '../shared/types';

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'SciEngTech Site Editor',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.ELECTRON_RENDERER_URL) {
    win.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    win.loadFile(join(__dirname, '../renderer/index.html'));
  }

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

function registerIpc(): void {
  ipcMain.handle('auth:login', () => loginWithGitHub());
  ipcMain.handle('auth:logout', () => {
    logout();
  });
  ipcMain.handle('auth:status', () => getAuthStatus());

  ipcMain.handle('workspace:sync', () => syncWorkspace());
  ipcMain.handle('workspace:paths', () => getWorkspacePaths());

  ipcMain.handle('catalog:load', () => loadCatalog());
  ipcMain.handle('catalog:save', (_e, product: CatalogProduct) => saveProduct(product));
  ipcMain.handle('catalog:create', (_e, product: CatalogProduct) => createProduct(product));
  ipcMain.handle('catalog:remove', (_e, id: string, type: ProductType) =>
    removeProduct(id, type),
  );

  ipcMain.handle('knowledge:load', () => loadKnowledge());
  ipcMain.handle('knowledge:save', (_e, article: KnowledgeArticle) => saveArticle(article));
  ipcMain.handle('knowledge:create', (_e, article: KnowledgeArticle) => createArticle(article));
  ipcMain.handle('knowledge:remove', (_e, id: string) => removeArticle(id));

  ipcMain.handle('images:pick', (_e, productId: string, slot: 'primary' | 'gallery') =>
    pickAndSaveImage(productId, slot),
  );
  ipcMain.handle('images:preview', (_e, relativePath: string) =>
    getPreviewFileUrl(relativePath),
  );
  ipcMain.handle('images:list', (_e, productId: string) => listProductImages(productId));

  ipcMain.handle('publish:dirty', () => getDirtySourceFiles());
  ipcMain.handle('publish:run', (_e, message: string) => publishChanges(message));
}

app.whenReady().then(() => {
  registerAssetProtocolHandler();
  registerIpc();
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
