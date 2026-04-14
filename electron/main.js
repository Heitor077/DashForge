const { app, BrowserWindow, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const { fileURLToPath } = require('node:url');

const isDev = !app.isPackaged;
const APP_TITLE = 'DashForge';
const DEV_URL = process.env.ELECTRON_START_URL || 'http://localhost:4200';
const APP_ID = 'com.dashforge';
const ICON_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets', 'icon.ico')
  : path.join(__dirname, 'assets', 'icon.ico');

const IPC_CHANNELS = {
  launcherOpen: 'launcher:open'
};

const ALLOWED_EXTERNAL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:']);
const ALLOWED_APP_EXTENSIONS = new Set(['.exe', '.bat', '.cmd', '.com', '.lnk', '.msc']);

function shouldOpenExternal(url) {
  try {
    const parsed = new URL(url);
    return ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol);
  } catch {
    return false;
  }
}

function isAllowedNavigation(url) {
  if (isDev) {
    return url.startsWith(DEV_URL);
  }

  return url.startsWith('file://');
}

function normalizeTarget(raw) {
  if (typeof raw !== 'string') {
    return '';
  }

  return raw.trim().slice(0, 4096);
}

function toSafeErrorMessage(error, fallbackMessage) {
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return fallbackMessage;
  }

  const message = String(error.message || '').trim();
  return message || fallbackMessage;
}

function normalizeWindowsTarget(rawTarget) {
  const trimmed = normalizeTarget(rawTarget);
  if (!trimmed || trimmed.includes('\0')) {
    return '';
  }

  const unquoted = trimmed.replace(/^"(.*)"$/, '$1');
  if (unquoted.startsWith('file://')) {
    try {
      return path.normalize(fileURLToPath(unquoted));
    } catch {
      return '';
    }
  }

  return path.normalize(unquoted);
}

function isAbsolutePath(target) {
  return path.isAbsolute(target);
}

async function getPathStats(target) {
  try {
    return await fs.promises.stat(target);
  } catch {
    return null;
  }
}

async function openPathTarget(target) {
  try {
    const openResult = await shell.openPath(target);
    if (openResult) {
      return { success: false, message: openResult };
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: toSafeErrorMessage(error, 'No se pudo abrir el recurso solicitado.') };
  }
}

async function openExternalTarget(target) {
  try {
    await shell.openExternal(target);
    return { success: true };
  } catch (error) {
    return { success: false, message: toSafeErrorMessage(error, 'No se pudo abrir la URL solicitada.') };
  }
}

async function handleLauncherOpen(request) {
  const type = typeof request?.type === 'string' ? request.type : '';
  const target = normalizeTarget(request?.target);

  if (!target) {
    return { success: false, message: 'El destino de apertura esta vacio.' };
  }

  if (type === 'url') {
    if (!shouldOpenExternal(target)) {
      return { success: false, message: 'URL no permitida. Usa http, https o mailto.' };
    }

    return openExternalTarget(target);
  }

  if (type === 'folder') {
    const normalizedPath = normalizeWindowsTarget(target);
    if (!normalizedPath || !isAbsolutePath(normalizedPath)) {
      return { success: false, message: 'La carpeta debe ser una ruta local absoluta.' };
    }

    const stats = await getPathStats(normalizedPath);
    if (!stats) {
      return { success: false, message: 'La carpeta indicada no existe.' };
    }

    if (!stats.isDirectory()) {
      return { success: false, message: 'El destino indicado no es una carpeta.' };
    }

    return openPathTarget(normalizedPath);
  }

  if (type === 'resource') {
    const normalizedPath = normalizeWindowsTarget(target);
    if (!normalizedPath || !isAbsolutePath(normalizedPath)) {
      return { success: false, message: 'El recurso debe ser una ruta local absoluta.' };
    }

    const stats = await getPathStats(normalizedPath);
    if (!stats) {
      return { success: false, message: 'El recurso indicado no existe.' };
    }

    if (!stats.isFile()) {
      return { success: false, message: 'El recurso indicado debe ser un archivo local.' };
    }

    return openPathTarget(normalizedPath);
  }

  if (type === 'external-app') {
    const normalizedPath = normalizeWindowsTarget(target);
    if (!normalizedPath || !isAbsolutePath(normalizedPath)) {
      return { success: false, message: 'openExternalApp requiere ruta absoluta a una aplicacion local.' };
    }

    const stats = await getPathStats(normalizedPath);
    if (!stats || !stats.isFile()) {
      return { success: false, message: 'La aplicacion indicada no existe o no es un archivo.' };
    }

    const extension = path.extname(normalizedPath).toLowerCase();
    if (!ALLOWED_APP_EXTENSIONS.has(extension)) {
      return { success: false, message: 'Tipo de aplicacion no permitido para openExternalApp.' };
    }

    return openPathTarget(normalizedPath);
  }

  return { success: false, message: 'Tipo de apertura no soportado.' };
}

function createMainWindow() {
  const mainWindow = new BrowserWindow({
    title: APP_TITLE,
    width: 1360,
    height: 860,
    minWidth: 1100,
    minHeight: 700,
    autoHideMenuBar: true,
    backgroundColor: '#111111',
    show: false,
    icon: fs.existsSync(ICON_PATH) ? ICON_PATH : undefined,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      // Keep preload bridge available for launcher IPC in desktop runtime.
      sandbox: false,
      webSecurity: true
    }
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (shouldOpenExternal(url)) {
      shell.openExternal(url);
    }

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (isAllowedNavigation(url)) {
      return;
    }

    event.preventDefault();
    if (shouldOpenExternal(url)) {
      shell.openExternal(url);
    }
  });

  if (isDev) {
    mainWindow.loadURL(DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  const indexPath = path.join(__dirname, '..', 'dist', 'dash-boar-interactivo', 'browser', 'index.html');
  mainWindow.loadFile(indexPath);
}

app.whenReady().then(() => {
  app.setAppUserModelId(APP_ID);

  ipcMain.handle(IPC_CHANNELS.launcherOpen, async (_event, request) => {
    try {
      return await handleLauncherOpen(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Fallo inesperado en runtime desktop.';
      return { success: false, message };
    }
  });

  createMainWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
