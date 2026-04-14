export interface VisualPresetOverlay {
  color?: string;
  opacity?: number;
}

export interface VisualPresetConfig {
  themeId: string;
  themeVariantId: string;
  wallpaperId: string;
  blur?: number;
  surfaceOpacity?: number;
  overlay?: VisualPresetOverlay;
  visualDensity?: 'comfortable' | 'compact';
  customWallpaperSource?: string;
}

export type VisualPresetSource = 'system' | 'user';

export interface VisualPreset {
  id: string;
  label: string;
  description?: string;
  source: VisualPresetSource;
  config: VisualPresetConfig;
  createdAt?: string;
  updatedAt?: string;
  isCustom?: boolean;
}
