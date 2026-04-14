export type WallpaperType = 'gradient' | 'image' | 'video';

export interface WallpaperOverlay {
  color: string;
  opacity: number;
}

export interface WallpaperVideoOptions {
  src: string;
  poster?: string;
  loop?: boolean;
  muted?: boolean;
}

export interface Wallpaper {
  id: string;
  label: string;
  type: WallpaperType;
  value: string;
  blurPx?: number;
  position?: string;
  size?: string;
  overlay: WallpaperOverlay;
  video?: WallpaperVideoOptions;
}
