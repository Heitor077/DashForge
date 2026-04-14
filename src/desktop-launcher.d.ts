import { DesktopLauncherApi } from './app/core/models/desktop-launcher-api.model';

declare global {
  interface Window {
    desktopLauncher?: DesktopLauncherApi;
  }
}

export {};
