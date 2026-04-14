export type ShortcutType = 'url' | 'folder' | 'resource';

export interface Shortcut {
  id: string;
  name: string;
  type: ShortcutType;
  value: string;
  isFavorite?: boolean;
  icon?: string;
  color?: string;
  categoryId?: string;
}

export interface ShortcutUpsertInput {
  id?: string;
  name: string;
  type: ShortcutType;
  value: string;
  isFavorite?: boolean;
  icon?: string;
  color?: string;
  categoryId?: string;
}

export interface ShortcutOperationResult {
  success: boolean;
  error?: string;
  shortcut?: Shortcut;
}
