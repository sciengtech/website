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
  reorderComponents,
  reorderSolutions,
  saveArticle,
  saveProduct,
} from './data-service';
import {
  deleteProductImage,
  getPreviewFileUrl,
  listProductImages,
  pickAndSaveImage,
  saveImagesFromPaths,
  type ImageAssetKind,
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
  ipcMain.handle('catalog:reorder', (_e, orderedIds: string[]) =>
    reorderComponents(orderedIds),
  );
  ipcMain.handle('catalog:reorderSolutions', (_e, orderedIds: string[]) =>
    reorderSolutions(orderedIds),
  );

  ipcMain.handle('knowledge:load', () => loadKnowledge());
  ipcMain.handle('knowledge:save', (_e, article: KnowledgeArticle) => saveArticle(article));
  ipcMain.handle('knowledge:create', (_e, article: KnowledgeArticle) => createArticle(article));
  ipcMain.handle('knowledge:remove', (_e, id: string) => removeArticle(id));

  ipcMain.handle(
    'images:pick',
    (
      _e,
      productId: string,
      slot: 'primary' | 'gallery',
      options?: { multi?: boolean; kind?: ImageAssetKind },
    ) => pickAndSaveImage(productId, slot, options),
  );
  ipcMain.handle(
    'images:savePaths',
    (
      _e,
      productId: string,
      filePaths: string[],
      slot: 'primary' | 'gallery',
      kind?: ImageAssetKind,
    ) => saveImagesFromPaths(productId, filePaths, slot, kind ?? 'product'),
  );
  ipcMain.handle('images:preview', (_e, relativePath: string) =>
    getPreviewFileUrl(relativePath),
  );
  ipcMain.handle(
    'images:list',
    (_e, productId: string, kind?: ImageAssetKind) =>
      listProductImages(productId, kind ?? 'product'),
  );
  ipcMain.handle('images:delete', (_e, relativePath: string) => {
    deleteProductImage(relativePath);
  });

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
