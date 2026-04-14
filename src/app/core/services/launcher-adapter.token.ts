import { inject, InjectionToken } from '@angular/core';

import { LauncherAdapter } from '../models/launcher.model';
import { DesktopLauncherAdapter } from './desktop-launcher.adapter';
import { WebLauncherAdapter } from './web-launcher.adapter';

// Swap this token provider in desktop runtime to plug an Electron adapter
// without changing Angular features/components.
export const LAUNCHER_ADAPTER = new InjectionToken<LauncherAdapter>('LAUNCHER_ADAPTER', {
  providedIn: 'root',
  factory: () => (window.desktopLauncher ? inject(DesktopLauncherAdapter) : inject(WebLauncherAdapter))
});
