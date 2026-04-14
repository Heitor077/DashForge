export type LauncherActionType = 'url' | 'folder' | 'resource' | 'external-app';

export interface LauncherRequest {
  type: LauncherActionType;
  target: string;
}

export interface LauncherResult {
  success: boolean;
  message?: string;
}

export interface LauncherCapabilities {
  canOpenUrl: boolean;
  canOpenFolder: boolean;
  canOpenResource: boolean;
  canOpenExternalApp: boolean;
  runtime: 'web' | 'desktop';
}

export interface LauncherAdapter {
  capabilities: LauncherCapabilities;
  open(request: LauncherRequest): Promise<LauncherResult>;
}
