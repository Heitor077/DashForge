import { Injectable } from '@angular/core';

import { Shortcut, ShortcutType } from '../models/shortcut.model';

type ShortcutIconId =
  | 'url'
  | 'folder'
  | 'resource'
  | 'github'
  | 'youtube'
  | 'spotify'
  | 'vscode'
  | 'angular'
  | 'gmail'
  | 'drive'
  | 'discord'
  | 'figma'
  | 'notion';

type IconShape =
  | { kind: 'path'; d: string; fill?: boolean }
  | { kind: 'circle'; cx: number; cy: number; r: number; fill?: boolean }
  | { kind: 'rect'; x: number; y: number; width: number; height: number; rx?: number; fill?: boolean };

interface ShortcutIconDefinition {
  id: ShortcutIconId;
  label: string;
  shapes: IconShape[];
}

export type ResolvedShortcutIcon =
  | { mode: 'svg'; definition: ShortcutIconDefinition }
  | { mode: 'initial'; text: string };

const SHORTCUT_ICON_REGISTRY: Record<ShortcutIconId, ShortcutIconDefinition> = {
  url: {
    id: 'url',
    label: 'Enlace',
    shapes: [
      { kind: 'path', d: 'M10.5 13.5 13.5 10.5' },
      { kind: 'path', d: 'M8.5 16.5 5.5 19.5a3 3 0 0 1-4.2-4.2l3-3' },
      { kind: 'path', d: 'M15.5 7.5 18.5 4.5a3 3 0 1 1 4.2 4.2l-3 3' }
    ]
  },
  folder: {
    id: 'folder',
    label: 'Carpeta',
    shapes: [
      { kind: 'path', d: 'M3 7.5A2.5 2.5 0 0 1 5.5 5H10l2 2h6.5A2.5 2.5 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5z' }
    ]
  },
  resource: {
    id: 'resource',
    label: 'Recurso',
    shapes: [
      { kind: 'rect', x: 4, y: 3, width: 16, height: 18, rx: 2 },
      { kind: 'path', d: 'M8 8h8' },
      { kind: 'path', d: 'M8 12h8' },
      { kind: 'path', d: 'M8 16h5' }
    ]
  },
  github: {
    id: 'github',
    label: 'GitHub',
    shapes: [
      { kind: 'path', d: 'M12 3a9 9 0 0 0-2.8 17.6V17.8c-2.2.5-2.7-1-2.7-1-.4-1-.9-1.3-.9-1.3-.8-.5.1-.5.1-.5.8.1 1.3.8 1.3.8.8 1.3 2 1 2.5.8.1-.6.3-1 .5-1.3-1.8-.2-3.6-.9-3.6-4.1 0-.9.3-1.6.8-2.2-.1-.2-.4-1 .1-2 .1 0 .8-.3 2.3.8a8 8 0 0 1 4.2 0c1.5-1.1 2.2-.8 2.2-.8.6 1 .2 1.8.1 2 .5.6.8 1.3.8 2.2 0 3.2-1.8 3.9-3.6 4.1.3.2.6.7.6 1.5v3.1A9 9 0 0 0 12 3z', fill: true }
    ]
  },
  youtube: {
    id: 'youtube',
    label: 'YouTube',
    shapes: [
      { kind: 'rect', x: 3, y: 7, width: 18, height: 10, rx: 4 },
      { kind: 'path', d: 'M11 10.2v3.6l3.2-1.8z', fill: true }
    ]
  },
  spotify: {
    id: 'spotify',
    label: 'Spotify',
    shapes: [
      { kind: 'circle', cx: 12, cy: 12, r: 9 },
      { kind: 'path', d: 'M8 10.2c2.7-1 5.5-.8 8.1.6' },
      { kind: 'path', d: 'M8.8 12.9c2.2-.7 4.4-.5 6.4.5' },
      { kind: 'path', d: 'M9.8 15.3c1.5-.4 3-.3 4.4.4' }
    ]
  },
  vscode: {
    id: 'vscode',
    label: 'VS Code',
    shapes: [
      { kind: 'path', d: 'M15.7 4.2 9 9.2 5.6 6.8 3.8 8.2 6.8 12l-3 3.8 1.8 1.4L9 14.8l6.7 5V4.2z', fill: true },
      { kind: 'path', d: 'M9 9.2v5.6' }
    ]
  },
  angular: {
    id: 'angular',
    label: 'Angular',
    shapes: [
      { kind: 'path', d: 'M12 3 4.5 5.8l1.2 10.1L12 21l6.3-5.1 1.2-10.1L12 3z' },
      { kind: 'path', d: 'M12 7.1 9 14h1.8l.7-1.7h1.9l.7 1.7H16L13 7.1z', fill: true }
    ]
  },
  gmail: {
    id: 'gmail',
    label: 'Gmail',
    shapes: [
      { kind: 'rect', x: 3, y: 6, width: 18, height: 12, rx: 2 },
      { kind: 'path', d: 'm3.7 7.4 8.3 6.1 8.3-6.1' }
    ]
  },
  drive: {
    id: 'drive',
    label: 'Drive',
    shapes: [
      { kind: 'path', d: 'M9 4h6l5 8H14z' },
      { kind: 'path', d: 'M4 12 9 4l5 8-5 8z' },
      { kind: 'path', d: 'M10 20h10l-5-8H5z' }
    ]
  },
  discord: {
    id: 'discord',
    label: 'Discord',
    shapes: [
      { kind: 'path', d: 'M6 8.5c2.2-1.6 9.8-1.6 12 0 .9 1.9 1.5 3.8 1.8 5.9-1.2 1.1-2.6 2-4.2 2.6l-.8-1.4c-.9.3-1.8.5-2.8.5s-1.9-.2-2.8-.5l-.8 1.4A12.5 12.5 0 0 1 4.2 14c.3-2 1-4 1.8-5.5z' },
      { kind: 'circle', cx: 9.6, cy: 12.4, r: 0.9, fill: true },
      { kind: 'circle', cx: 14.4, cy: 12.4, r: 0.9, fill: true }
    ]
  },
  figma: {
    id: 'figma',
    label: 'Figma',
    shapes: [
      { kind: 'circle', cx: 10, cy: 6.5, r: 2.5 },
      { kind: 'circle', cx: 14, cy: 6.5, r: 2.5 },
      { kind: 'circle', cx: 10, cy: 12, r: 2.5 },
      { kind: 'circle', cx: 14, cy: 12, r: 2.5 },
      { kind: 'circle', cx: 10, cy: 17.5, r: 2.5 }
    ]
  },
  notion: {
    id: 'notion',
    label: 'Notion',
    shapes: [
      { kind: 'rect', x: 4, y: 4, width: 16, height: 16, rx: 1 },
      { kind: 'path', d: 'M8.1 16.3V8.2h1.8l3.3 5.4V8.2H15v8.1h-1.8l-3.3-5.4v5.4z', fill: true }
    ]
  }
};

const ICON_ALIAS_MAP: Record<string, ShortcutIconId> = {
  url: 'url',
  link: 'url',
  folder: 'folder',
  dir: 'folder',
  resource: 'resource',
  file: 'resource',
  github: 'github',
  gh: 'github',
  youtube: 'youtube',
  yt: 'youtube',
  spotify: 'spotify',
  sp: 'spotify',
  vscode: 'vscode',
  vs: 'vscode',
  angular: 'angular',
  ng: 'angular',
  gmail: 'gmail',
  mail: 'gmail',
  drive: 'drive',
  gdrive: 'drive',
  discord: 'discord',
  figma: 'figma',
  notion: 'notion'
};

@Injectable({ providedIn: 'root' })
export class ShortcutIconService {
  resolve(shortcut: Shortcut): ResolvedShortcutIcon {
    const explicitIconId = this.resolveIconId(shortcut.icon);
    if (explicitIconId) {
      return { mode: 'svg', definition: SHORTCUT_ICON_REGISTRY[explicitIconId] };
    }

    const autoDetectedIconId = this.detectFromShortcut(shortcut);
    if (autoDetectedIconId) {
      return { mode: 'svg', definition: SHORTCUT_ICON_REGISTRY[autoDetectedIconId] };
    }

    const genericIconId = this.genericForType(shortcut.type);
    if (genericIconId) {
      return { mode: 'svg', definition: SHORTCUT_ICON_REGISTRY[genericIconId] };
    }

    return { mode: 'initial', text: this.toInitials(shortcut.name) };
  }

  private resolveIconId(rawIcon: string | undefined): ShortcutIconId | null {
    const normalized = (rawIcon ?? '').trim().toLowerCase();
    if (!normalized) {
      return null;
    }

    return ICON_ALIAS_MAP[normalized] ?? null;
  }

  private detectFromShortcut(shortcut: Shortcut): ShortcutIconId | null {
    const haystack = `${shortcut.name} ${shortcut.value}`.toLowerCase();
    if (haystack.includes('github')) {
      return 'github';
    }
    if (haystack.includes('youtube') || haystack.includes('youtu.be')) {
      return 'youtube';
    }
    if (haystack.includes('spotify')) {
      return 'spotify';
    }
    if (haystack.includes('code.visualstudio') || haystack.includes('vscode') || haystack.includes('vs code')) {
      return 'vscode';
    }
    if (haystack.includes('angular.dev') || haystack.includes('angular')) {
      return 'angular';
    }
    if (haystack.includes('gmail') || haystack.includes('mail.google')) {
      return 'gmail';
    }
    if (haystack.includes('drive.google') || haystack.includes('gdrive') || haystack.includes('google drive')) {
      return 'drive';
    }
    if (haystack.includes('discord')) {
      return 'discord';
    }
    if (haystack.includes('figma')) {
      return 'figma';
    }
    if (haystack.includes('notion')) {
      return 'notion';
    }

    return null;
  }

  private genericForType(type: ShortcutType): ShortcutIconId {
    if (type === 'folder') {
      return 'folder';
    }
    if (type === 'resource') {
      return 'resource';
    }
    return 'url';
  }

  private toInitials(name: string): string {
    const cleaned = name.trim();
    if (!cleaned) {
      return 'SC';
    }

    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }

    return cleaned.slice(0, 2).toUpperCase();
  }
}
