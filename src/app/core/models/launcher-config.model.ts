import { Category } from './category.model';
import { DashboardSettings } from './dashboard-settings.model';
import { Shortcut } from './shortcut.model';
import { VisualPreset } from './visual-preset.model';

export interface LauncherConfigDataV1 {
  shortcuts: Shortcut[];
  categories: Category[];
  settings: DashboardSettings;
  visualState: {
    themeId: string;
    wallpaperId: string;
    presetId: string;
  };
  customPresets: VisualPreset[];
}

export interface LauncherConfigExportV1 {
  version: 1;
  app: 'dashboar-interactivo';
  exportedAt: string;
  data: LauncherConfigDataV1;
}

export interface LauncherConfigImportResult {
  success: boolean;
  error?: string;
}
