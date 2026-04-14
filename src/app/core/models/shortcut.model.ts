export type ShortcutType = 'url' | 'folder' | 'resource';

export interface ShortcutItem {
  id: string;
  name: string;
  type: ShortcutType;
  value: string;
  isFavorite?: boolean;
  includeInProjectLaunch?: boolean;
  icon?: string;
  color?: string;
  categoryId?: string;
}

export type Shortcut = ShortcutItem;

export interface ShortcutUpsertInput {
  id?: string;
  name: string;
  type: ShortcutType;
  value: string;
  isFavorite?: boolean;
  includeInProjectLaunch?: boolean;
  icon?: string;
  color?: string;
  categoryId?: string;
}

export interface ShortcutOperationResult {
  success: boolean;
  error?: string;
  shortcut?: ShortcutItem;
}
