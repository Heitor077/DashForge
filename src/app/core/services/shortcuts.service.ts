import { Injectable, computed, inject, signal } from '@angular/core';

import { DEFAULT_CATEGORIES, DEFAULT_SHORTCUTS } from '../data/default-data';
import { LauncherResult } from '../models/launcher.model';
import { Category } from '../models/category.model';
import { Shortcut, ShortcutOperationResult, ShortcutType, ShortcutUpsertInput } from '../models/shortcut.model';
import { LauncherService } from './launcher.service';
import { StorageService } from './storage.service';

const SHORTCUTS_STORAGE_KEY = 'dashboard.shortcuts';
const CATEGORIES_STORAGE_KEY = 'dashboard.categories';

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly launcherService = inject(LauncherService);
  private readonly storageService = inject(StorageService);

  private readonly categoriesSignal = signal<Category[]>(DEFAULT_CATEGORIES);
  private readonly shortcutsSignal = signal<Shortcut[]>([]);

  readonly categories = computed(() => this.categoriesSignal());
  readonly shortcuts = computed(() => this.shortcutsSignal());

  constructor() {
    this.loadCategories();
    this.loadShortcuts();
  }

  async openShortcut(shortcut: Shortcut): Promise<LauncherResult> {
    let result: { success: boolean; message?: string };

    if (shortcut.type === 'url') {
      result = await this.launcherService.openUrl(shortcut.value);
    } else if (shortcut.type === 'folder') {
      result = await this.launcherService.openFolder(shortcut.value);
    } else {
      result = await this.launcherService.openResource(shortcut.value);
    }

    if (!result.success && result.message) {
      console.error(`[launcher] ${shortcut.type} -> ${shortcut.value} :: ${result.message}`);
    }

    return result;
  }

  createShortcut(input: ShortcutUpsertInput): ShortcutOperationResult {
    const validation = this.validateInput(input);
    if (!validation.success) {
      return validation;
    }

    const shortcut: Shortcut = {
      id: this.createId(),
      name: input.name.trim(),
      type: input.type,
      value: input.value.trim(),
      isFavorite: Boolean(input.isFavorite),
      icon: input.icon?.trim() || undefined,
      color: input.color?.trim() || undefined,
      categoryId: input.categoryId?.trim() || undefined
    };

    this.shortcutsSignal.update((current) => [shortcut, ...current]);
    this.persistShortcuts();

    return { success: true, shortcut };
  }

  updateShortcut(input: ShortcutUpsertInput): ShortcutOperationResult {
    const shortcutId = input.id?.trim();
    if (!shortcutId) {
      return { success: false, error: 'El acceso no tiene id valido.' };
    }

    const validation = this.validateInput(input);
    if (!validation.success) {
      return validation;
    }

    let updatedShortcut: Shortcut | undefined;
    let found = false;
    this.shortcutsSignal.update((current) =>
      current.map((shortcut) => {
        if (shortcut.id !== shortcutId) {
          return shortcut;
        }

        found = true;
        updatedShortcut = {
          ...shortcut,
          name: input.name.trim(),
          type: input.type,
          value: input.value.trim(),
          isFavorite: input.isFavorite ?? shortcut.isFavorite ?? false,
          icon: input.icon?.trim() || undefined,
          color: input.color?.trim() || undefined,
          categoryId: input.categoryId?.trim() || undefined
        };
        return updatedShortcut;
      })
    );

    if (!found || !updatedShortcut) {
      return { success: false, error: 'No se encontro el acceso a editar.' };
    }

    this.persistShortcuts();
    return { success: true, shortcut: updatedShortcut };
  }

  deleteShortcut(shortcutId: string): ShortcutOperationResult {
    const current = this.shortcutsSignal();
    const exists = current.some((shortcut) => shortcut.id === shortcutId);
    if (!exists) {
      return { success: false, error: 'No se encontro el acceso a eliminar.' };
    }

    this.shortcutsSignal.set(current.filter((shortcut) => shortcut.id !== shortcutId));
    this.persistShortcuts();
    return { success: true };
  }

  toggleFavorite(shortcutId: string): ShortcutOperationResult {
    let updatedShortcut: Shortcut | undefined;
    let found = false;

    this.shortcutsSignal.update((current) =>
      current.map((shortcut) => {
        if (shortcut.id !== shortcutId) {
          return shortcut;
        }

        found = true;
        updatedShortcut = {
          ...shortcut,
          isFavorite: !shortcut.isFavorite
        };
        return updatedShortcut;
      })
    );

    if (!found || !updatedShortcut) {
      return { success: false, error: 'No se encontro el acceso a destacar.' };
    }

    this.persistShortcuts();
    return { success: true, shortcut: updatedShortcut };
  }

  setShortcutsOrder(sortedShortcuts: Shortcut[]): ShortcutOperationResult {
    const current = this.shortcutsSignal();
    if (sortedShortcuts.length !== current.length) {
      return { success: false, error: 'El orden recibido no es valido.' };
    }

    const currentIds = new Set(current.map((shortcut) => shortcut.id));
    const incomingIds = new Set(sortedShortcuts.map((shortcut) => shortcut.id));
    if (currentIds.size !== incomingIds.size) {
      return { success: false, error: 'El orden recibido no coincide con los accesos actuales.' };
    }

    for (const id of currentIds) {
      if (!incomingIds.has(id)) {
        return { success: false, error: 'El orden recibido no coincide con los accesos actuales.' };
      }
    }

    this.shortcutsSignal.set([...sortedShortcuts]);
    this.persistShortcuts();
    return { success: true };
  }

  createCategory(name: string): ShortcutOperationResult {
    const categoryName = name.trim();
    if (!categoryName) {
      return { success: false, error: 'El nombre de la categoria es obligatorio.' };
    }

    const alreadyExists = this.categoriesSignal().some(
      (category) => category.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (alreadyExists) {
      return { success: false, error: 'Ya existe una categoria con ese nombre.' };
    }

    this.categoriesSignal.update((current) => [
      ...current,
      { id: `cat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`, name: categoryName }
    ]);
    this.persistCategories();
    return { success: true };
  }

  updateCategory(categoryId: string, name: string): ShortcutOperationResult {
    const categoryName = name.trim();
    if (!categoryName) {
      return { success: false, error: 'El nombre de la categoria es obligatorio.' };
    }

    let found = false;
    this.categoriesSignal.update((current) =>
      current.map((category) => {
        if (category.id !== categoryId) {
          return category;
        }
        found = true;
        return { ...category, name: categoryName };
      })
    );

    if (!found) {
      return { success: false, error: 'No se encontro la categoria a editar.' };
    }

    this.persistCategories();
    return { success: true };
  }

  deleteCategory(categoryId: string): ShortcutOperationResult {
    const exists = this.categoriesSignal().some((category) => category.id === categoryId);
    if (!exists) {
      return { success: false, error: 'No se encontro la categoria a eliminar.' };
    }

    this.categoriesSignal.update((current) => current.filter((category) => category.id !== categoryId));
    this.shortcutsSignal.update((current) =>
      current.map((shortcut) => {
        if (shortcut.categoryId !== categoryId) {
          return shortcut;
        }
        return { ...shortcut, categoryId: undefined };
      })
    );

    this.persistCategories();
    this.persistShortcuts();
    return { success: true };
  }

  getSnapshot(): { shortcuts: Shortcut[]; categories: Category[] } {
    return {
      shortcuts: [...this.shortcutsSignal()],
      categories: [...this.categoriesSignal()]
    };
  }

  validateImportedData(payload: { shortcuts: Shortcut[]; categories: Category[] }): ShortcutOperationResult {
    const normalizedCategories = payload.categories
      .map((category) => this.normalizeCategory(category))
      .filter((category): category is Category => category !== null);
    if (normalizedCategories.length !== payload.categories.length) {
      return { success: false, error: 'Hay categorias invalidas en el archivo.' };
    }

    const uniqueCategoryIds = new Set<string>();
    for (const category of normalizedCategories) {
      if (uniqueCategoryIds.has(category.id)) {
        return { success: false, error: 'Hay categorias duplicadas en el archivo.' };
      }
      uniqueCategoryIds.add(category.id);
    }

    const validCategoryIds = new Set(normalizedCategories.map((category) => category.id));
    const normalizedShortcuts = payload.shortcuts
      .map((shortcut) => this.normalizeShortcut(shortcut, validCategoryIds))
      .filter((shortcut): shortcut is Shortcut => shortcut !== null);
    if (normalizedShortcuts.length !== payload.shortcuts.length) {
      return { success: false, error: 'Hay accesos invalidos en el archivo.' };
    }

    return { success: true };
  }

  applyImportedData(payload: { shortcuts: Shortcut[]; categories: Category[] }): ShortcutOperationResult {
    const validation = this.validateImportedData(payload);
    if (!validation.success) {
      return validation;
    }

    const normalizedCategories = payload.categories
      .map((category) => this.normalizeCategory(category))
      .filter((category): category is Category => category !== null);

    const validCategoryIds = new Set(normalizedCategories.map((category) => category.id));
    const normalizedShortcuts = payload.shortcuts
      .map((shortcut) => this.normalizeShortcut(shortcut, validCategoryIds))
      .filter((shortcut): shortcut is Shortcut => shortcut !== null);

    this.categoriesSignal.set(normalizedCategories);
    this.shortcutsSignal.set(normalizedShortcuts);
    this.persistCategories();
    this.persistShortcuts();
    return { success: true };
  }

  private loadCategories(): void {
    const storedCategories = this.storageService.getItem<Category[]>(CATEGORIES_STORAGE_KEY);
    const categories = storedCategories && storedCategories.length > 0 ? storedCategories : DEFAULT_CATEGORIES;
    this.categoriesSignal.set(categories);
    this.persistCategories();
  }

  private loadShortcuts(): void {
    const storedShortcuts = this.storageService.getItem<unknown[]>(SHORTCUTS_STORAGE_KEY);
    const validCategoryIds = new Set(this.categoriesSignal().map((category) => category.id));
    const normalized = (storedShortcuts ?? [])
      .map((item) => this.normalizeShortcut(item, validCategoryIds))
      .filter((item): item is Shortcut => item !== null);
    const shortcuts = normalized.length > 0 ? normalized : DEFAULT_SHORTCUTS;

    this.shortcutsSignal.set(shortcuts);
    this.persistShortcuts();
  }

  private persistCategories(): void {
    this.storageService.setItem(CATEGORIES_STORAGE_KEY, this.categoriesSignal());
  }

  private persistShortcuts(): void {
    this.storageService.setItem(SHORTCUTS_STORAGE_KEY, this.shortcutsSignal());
  }

  private validateInput(input: ShortcutUpsertInput): ShortcutOperationResult {
    if (!input.name?.trim()) {
      return { success: false, error: 'El nombre es obligatorio.' };
    }

    if (!this.isValidShortcutType(input.type)) {
      return { success: false, error: 'El tipo de acceso no es valido.' };
    }

    if (!input.value?.trim()) {
      return { success: false, error: 'El valor es obligatorio.' };
    }

    const typeAwareValueError = this.getTypeAwareValueError(input.type, input.value.trim());
    if (typeAwareValueError) {
      return { success: false, error: typeAwareValueError };
    }

    return { success: true };
  }

  private isValidShortcutType(value: string): value is ShortcutType {
    return value === 'url' || value === 'folder' || value === 'resource';
  }

  private createId(): string {
    return `sc-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  }

  private normalizeShortcut(raw: unknown, validCategoryIds: Set<string>): Shortcut | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as Record<string, unknown>;
    const legacyName = typeof source['title'] === 'string' ? source['title'] : '';
    const legacyValue = typeof source['target'] === 'string' ? source['target'] : '';
    const type = this.isValidShortcutType(String(source['type'] ?? '')) ? (source['type'] as ShortcutType) : null;
    const name = typeof source['name'] === 'string' ? source['name'] : legacyName;
    const value = typeof source['value'] === 'string' ? source['value'] : legacyValue;

    if (!type || !name?.trim() || !value?.trim()) {
      return null;
    }

    const normalizedValue = value.trim();
    if (this.getTypeAwareValueError(type, normalizedValue)) {
      return null;
    }

    const id = typeof source['id'] === 'string' && source['id'].trim() ? source['id'] : this.createId();
    const icon = typeof source['icon'] === 'string' ? source['icon'].trim() : '';
    const color = typeof source['color'] === 'string' ? source['color'].trim() : '';
    const categoryId = typeof source['categoryId'] === 'string' ? source['categoryId'].trim() : '';
    const isFavorite = typeof source['isFavorite'] === 'boolean' ? source['isFavorite'] : false;
    const normalizedCategoryId = categoryId && validCategoryIds.has(categoryId) ? categoryId : '';

    return {
      id,
      name: name.trim(),
      type,
      value: normalizedValue,
      isFavorite,
      icon: icon || undefined,
      color: color || undefined,
      categoryId: normalizedCategoryId || undefined
    };
  }

  private getTypeAwareValueError(type: ShortcutType, rawValue: string): string | null {
    if (type === 'url') {
      return this.isAllowedWebUrl(rawValue) ? null : 'Para tipo url usa http, https o mailto.';
    }

    if (!this.isLikelyAbsoluteLocalPath(rawValue)) {
      return 'Usa una ruta local absoluta (ej: C:\\\\Ruta\\\\Destino o \\\\Servidor\\\\Recurso).';
    }

    if (type === 'folder') {
      return this.looksLikeLocalFile(rawValue)
        ? 'Para tipo folder indica una carpeta local, no un archivo.'
        : null;
    }

    return this.looksLikeLocalFolder(rawValue)
      ? 'Para tipo resource indica un archivo local, no una carpeta.'
      : null;
  }

  private isAllowedWebUrl(value: string): boolean {
    try {
      const parsed = new URL(value);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'mailto:';
    } catch {
      return false;
    }
  }

  private isLikelyAbsoluteLocalPath(value: string): boolean {
    const normalized = value.trim();
    return /^[a-zA-Z]:[\\/]/.test(normalized) || /^\\\\[^\\]+\\[^\\]+/.test(normalized) || normalized.startsWith('file://');
  }

  private looksLikeLocalFolder(value: string): boolean {
    return /[\\/]$/.test(value.trim());
  }

  private looksLikeLocalFile(value: string): boolean {
    const trimmed = value.trim().replace(/[\\/]+$/, '');
    const segment = trimmed.split(/[\\/]/).pop() ?? '';
    return /\.[a-zA-Z0-9]{1,12}$/.test(segment);
  }

  private normalizeCategory(raw: unknown): Category | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as Record<string, unknown>;
    const id = typeof source['id'] === 'string' ? source['id'].trim() : '';
    const name = typeof source['name'] === 'string' ? source['name'].trim() : '';
    const icon = typeof source['icon'] === 'string' ? source['icon'].trim() : '';
    const color = typeof source['color'] === 'string' ? source['color'].trim() : '';

    if (!id || !name) {
      return null;
    }

    return {
      id,
      name,
      icon: icon || undefined,
      color: color || undefined
    };
  }
}
