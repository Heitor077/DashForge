import { Injectable } from '@angular/core';

import { DesktopLauncherApi } from '../models/desktop-launcher-api.model';
import { LauncherAdapter, LauncherRequest, LauncherResult } from '../models/launcher.model';

@Injectable({ providedIn: 'root' })
export class DesktopLauncherAdapter implements LauncherAdapter {
  private readonly desktopApi: DesktopLauncherApi | undefined = window.desktopLauncher;

  readonly capabilities = this.desktopApi?.capabilities ?? {
    canOpenUrl: false,
    canOpenFolder: false,
    canOpenResource: false,
    canOpenExternalApp: false,
    runtime: 'web' as const
  };

  async open(request: LauncherRequest): Promise<LauncherResult> {
    const target = request.target?.trim();
    if (!target) {
      return { success: false, message: 'El destino de apertura esta vacio.' };
    }

    if (!this.desktopApi) {
      return { success: false, message: 'Bridge desktop no disponible.' };
    }

    if (!this.isActionSupported(request.type)) {
      return { success: false, message: 'La accion solicitada no esta disponible en este runtime.' };
    }

    if (request.type === 'url') {
      return this.desktopApi.openUrl(target);
    }

    if (request.type === 'folder') {
      return this.desktopApi.openFolder(target);
    }

    if (request.type === 'resource') {
      return this.desktopApi.openResource(target);
    }

    if (request.type === 'external-app') {
      return this.desktopApi.openExternalApp(target);
    }

    return { success: false, message: 'Tipo de apertura no soportado.' };
  }

  private isActionSupported(type: LauncherRequest['type']): boolean {
    if (type === 'url') {
      return this.capabilities.canOpenUrl;
    }

    if (type === 'folder') {
      return this.capabilities.canOpenFolder;
    }

    if (type === 'resource') {
      return this.capabilities.canOpenResource;
    }

    if (type === 'external-app') {
      return this.capabilities.canOpenExternalApp;
    }

    return false;
  }
}
