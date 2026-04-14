import { LauncherCapabilities, LauncherResult } from './launcher.model';

export interface DesktopLauncherApi {
  runtime: 'desktop';
  platform: string;
  capabilities: LauncherCapabilities;
  openUrl(target: string): Promise<LauncherResult>;
  openFolder(target: string): Promise<LauncherResult>;
  openResource(target: string): Promise<LauncherResult>;
  openExternalApp(target: string): Promise<LauncherResult>;
}
