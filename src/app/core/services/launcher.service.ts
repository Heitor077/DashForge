import { Injectable, inject } from '@angular/core';

import { LauncherActionType, LauncherCapabilities, LauncherResult } from '../models/launcher.model';
import { LAUNCHER_ADAPTER } from './launcher-adapter.token';

@Injectable({ providedIn: 'root' })
export class LauncherService {
  private readonly adapter = inject(LAUNCHER_ADAPTER);

  readonly capabilities: LauncherCapabilities = this.adapter.capabilities;

  openUrl(url: string): Promise<LauncherResult> {
    return this.open('url', url);
  }

  openFolder(path: string): Promise<LauncherResult> {
    return this.open('folder', path);
  }

  openResource(resource: string): Promise<LauncherResult> {
    return this.open('resource', resource);
  }

  openExternalApp(appTarget: string): Promise<LauncherResult> {
    return this.open('external-app', appTarget);
  }

  private open(type: LauncherActionType, target: string): Promise<LauncherResult> {
    return this.adapter.open({ type, target: target.trim() });
  }
}
