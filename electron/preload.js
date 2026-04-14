const { contextBridge, ipcRenderer } = require('electron');

const IPC_CHANNELS = {
  launcherOpen: 'launcher:open'
};

const ACTIONS = new Set(['url', 'folder', 'resource', 'external-app']);

function normalizeTarget(raw) {
  if (typeof raw !== 'string') {
    return '';
  }

  return raw.trim().slice(0, 4096);
}

function toLauncherResult(raw) {
  if (!raw || typeof raw !== 'object') {
    return { success: false, message: 'Respuesta invalida del proceso principal.' };
  }

  const success = raw.success === true;
  const message = typeof raw.message === 'string' ? raw.message : undefined;
  return { success, message };
}

async function invokeLauncher(type, target) {
  const normalizedTarget = normalizeTarget(target);
  if (!ACTIONS.has(type)) {
    return { success: false, message: 'Tipo de apertura no soportado.' };
  }

  if (!normalizedTarget) {
    return { success: false, message: 'El destino de apertura esta vacio.' };
  }

  try {
    const response = await ipcRenderer.invoke(IPC_CHANNELS.launcherOpen, {
      type,
      target: normalizedTarget
    });
    return toLauncherResult(response);
  } catch {
    return { success: false, message: 'No se pudo contactar con el proceso principal.' };
  }
}

const desktopLauncherApi = Object.freeze({
  runtime: 'desktop',
  platform: process.platform,
  capabilities: Object.freeze({
    canOpenUrl: true,
    canOpenFolder: true,
    canOpenResource: true,
    canOpenExternalApp: true,
    runtime: 'desktop'
  }),
  openUrl: (target) => invokeLauncher('url', target),
  openFolder: (target) => invokeLauncher('folder', target),
  openResource: (target) => invokeLauncher('resource', target),
  openExternalApp: (target) => invokeLauncher('external-app', target)
});

contextBridge.exposeInMainWorld('desktopLauncher', desktopLauncherApi);
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform
});
