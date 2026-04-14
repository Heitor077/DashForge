export interface DashboardLayoutOptions {
  compactMode?: boolean;
  columns?: number;
}

export type DashboardVisualDensity = 'comfortable' | 'compact';
export type DashboardOpenBehavior = 'new-tab' | 'same-tab' | 'system';

export interface DashboardPreferences {
  visualDensity: DashboardVisualDensity;
  showShortcutLabels: boolean;
  openBehavior: DashboardOpenBehavior;
  wallpaperBlurPx: number;
  customWallpaperSource: string;
  activePresetId: string;
  wallpaperOverlayColor: string;
  wallpaperOverlayOpacity: number;
  surfaceOpacity: number;
}

export interface DashboardSettings {
  themeId: string;
  themeVariantId: string;
  wallpaperId: string;
  layoutOptions?: DashboardLayoutOptions;
  preferences?: DashboardPreferences;
}

export const DEFAULT_DASHBOARD_LAYOUT_OPTIONS: DashboardLayoutOptions = {
  compactMode: false,
  columns: 3
};

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  visualDensity: 'comfortable',
  showShortcutLabels: true,
  openBehavior: 'new-tab',
  wallpaperBlurPx: 0,
  customWallpaperSource: '',
  activePresetId: '',
  wallpaperOverlayColor: '',
  wallpaperOverlayOpacity: -1,
  surfaceOpacity: 0.9
};
