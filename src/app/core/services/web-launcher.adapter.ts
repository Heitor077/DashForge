import { Injectable } from '@angular/core';

import { LauncherAdapter, LauncherRequest, LauncherResult } from '../models/launcher.model';

@Injectable({ providedIn: 'root' })
export class WebLauncherAdapter implements LauncherAdapter {
  readonly capabilities = {
    canOpenUrl: true,
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

    if (request.type === 'url') {
      if (!this.isAllowedWebUrl(target)) {
        return { success: false, message: 'URL no valida para runtime web.' };
      }

      window.open(target, '_blank', 'noopener,noreferrer');
      return { success: true };
    }

    if (request.type === 'folder') {
      return {
        success: false,
        message: 'openFolder requiere runtime desktop. En web queda como placeholder.'
      };
    }

    if (request.type === 'external-app') {
      return {
        success: false,
        message: 'openExternalApp requiere runtime desktop. En web queda como placeholder.'
      };
    }

    return {
      success: false,
      message: 'openResource requiere runtime desktop. En web queda como placeholder.'
    };
  }

  private isAllowedWebUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
    } catch {
      return false;
    }
  }
}
