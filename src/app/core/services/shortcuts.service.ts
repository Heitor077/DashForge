import { Injectable, computed, inject, signal } from '@angular/core';

import { DEFAULT_CATEGORIES, DEFAULT_SHORTCUTS } from '../data/default-data';
import { AppState } from '../models/app-state.model';
import { LauncherResult } from '../models/launcher.model';
import { ProjectItem } from '../models/project.model';
import { Category } from '../models/category.model';
import { Shortcut, ShortcutOperationResult, ShortcutType, ShortcutUpsertInput } from '../models/shortcut.model';
import { LauncherService } from './launcher.service';
import { StorageService } from './storage.service';

const APP_STATE_STORAGE_KEY = 'dashboard.app-state';
const LEGACY_SHORTCUTS_STORAGE_KEY = 'dashboard.shortcuts';
const CATEGORIES_STORAGE_KEY = 'dashboard.categories';
const GENERAL_PROJECT_ID = 'general';
const GENERAL_PROJECT_NAME = 'General';

@Injectable({ providedIn: 'root' })
export class ShortcutsService {
  private readonly launcherService = inject(LauncherService);
  private readonly storageService = inject(StorageService);

  private readonly categoriesSignal = signal<Category[]>(DEFAULT_CATEGORIES);
  private readonly shortcutsSignal = signal<Shortcut[]>([]);
  private readonly projectsSignal = signal<ProjectItem[]>([]);
  private readonly activeProjectIdSignal = signal<string>(GENERAL_PROJECT_ID);

  readonly categories = computed(() => this.categoriesSignal());
  readonly projects = computed(() => this.projectsSignal());
  readonly activeProjectId = computed(() => this.getActiveProject().id);
  readonly activeProject = computed(() => this.getActiveProject());
  readonly shortcuts = computed(() => this.getActiveProjectShortcuts());

  constructor() {
    this.loadCategories();
    this.loadAppState();
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
      includeInProjectLaunch: Boolean(input.includeInProjectLaunch),
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
      return { success: false, error: 'El acceso no tiene id válido.' };
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
          includeInProjectLaunch: input.includeInProjectLaunch ?? shortcut.includeInProjectLaunch ?? false,
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
      return { success: false, error: 'El orden recibido no es válido.' };
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

  copyShortcutToProject(shortcutId: string, destinationProjectId: string): ShortcutOperationResult {
    const sourceShortcutId = shortcutId.trim();
    if (!sourceShortcutId) {
      return { success: false, error: 'No se encontro el acceso a copiar.' };
    }

    const targetProjectId = destinationProjectId.trim();
    if (!targetProjectId) {
      return { success: false, error: 'Selecciona un proyecto de destino válido.' };
    }

    const activeProject = this.getActiveProject();
    if (targetProjectId === activeProject.id) {
      return { success: false, error: 'El destino debe ser distinto del proyecto activo.' };
    }

    const sourceShortcut = this.shortcutsSignal().find((shortcut) => shortcut.id === sourceShortcutId);
    if (!sourceShortcut) {
      return { success: false, error: 'No se encontro el acceso en el proyecto activo.' };
    }

    const destinationProject = this.projectsSignal().find((project) => project.id === targetProjectId);
    if (!destinationProject) {
      return { success: false, error: 'No se encontro el proyecto de destino.' };
    }

    const copiedShortcut: Shortcut = {
      id: this.createId(),
      name: sourceShortcut.name,
      type: sourceShortcut.type,
      value: sourceShortcut.value,
      isFavorite: sourceShortcut.isFavorite,
      includeInProjectLaunch: sourceShortcut.includeInProjectLaunch,
      icon: sourceShortcut.icon,
      color: sourceShortcut.color,
      categoryId: sourceShortcut.categoryId
    };

    this.projectsSignal.update((projects) =>
      projects.map((project) =>
        project.id === destinationProject.id
          ? {
              ...project,
              shortcuts: [copiedShortcut, ...project.shortcuts]
            }
          : project
      )
    );

    this.persistAppState();
    return { success: true, shortcut: copiedShortcut };
  }

  copyShortcutsToProject(shortcutIds: string[], destinationProjectId: string): ShortcutOperationResult {
    const targetProjectId = destinationProjectId.trim();
    if (!targetProjectId) {
      return { success: false, error: 'Selecciona un proyecto de destino válido.' };
    }

    const activeProject = this.getActiveProject();
    if (targetProjectId === activeProject.id) {
      return { success: false, error: 'El destino debe ser distinto del proyecto activo.' };
    }

    const destinationProject = this.projectsSignal().find((project) => project.id === targetProjectId);
    if (!destinationProject) {
      return { success: false, error: 'No se encontro el proyecto de destino.' };
    }

    const normalizedIds = shortcutIds
      .map((id) => id.trim())
      .filter((id) => id.length > 0);
    if (normalizedIds.length === 0) {
      return { success: false, error: 'Selecciona al menos un acceso para copiar.' };
    }

    const sourceById = new Map(this.shortcutsSignal().map((shortcut) => [shortcut.id, shortcut]));
    const copiedShortcuts: Shortcut[] = [];

    normalizedIds.forEach((id) => {
      const sourceShortcut = sourceById.get(id);
      if (!sourceShortcut) {
        return;
      }

      copiedShortcuts.push({
        id: this.createId(),
        name: sourceShortcut.name,
        type: sourceShortcut.type,
        value: sourceShortcut.value,
        isFavorite: sourceShortcut.isFavorite,
        includeInProjectLaunch: sourceShortcut.includeInProjectLaunch,
        icon: sourceShortcut.icon,
        color: sourceShortcut.color,
        categoryId: sourceShortcut.categoryId
      });
    });

    if (copiedShortcuts.length === 0) {
      return { success: false, error: 'No se encontraron accesos válidos para copiar.' };
    }

    this.projectsSignal.update((projects) =>
      projects.map((project) =>
        project.id === targetProjectId
          ? {
              ...project,
              shortcuts: [...copiedShortcuts, ...project.shortcuts]
            }
          : project
      )
    );

    this.persistAppState();
    return { success: true };
  }

  updateActiveProjectLaunchSelection(shortcutIds: string[]): ShortcutOperationResult {
    const selectedIds = new Set(
      shortcutIds
        .map((id) => id.trim())
        .filter((id) => id.length > 0)
    );

    const updatedShortcuts = this.shortcutsSignal().map((shortcut) => ({
      ...shortcut,
      includeInProjectLaunch: selectedIds.has(shortcut.id)
    }));

    this.shortcutsSignal.set(updatedShortcuts);
    this.persistShortcuts();
    return { success: true };
  }

  getActiveProject(): ProjectItem {
    const projects = this.projectsSignal();
    if (projects.length === 0) {
      const fallbackProject = this.createGeneralProject([...this.shortcutsSignal()]);
      this.projectsSignal.set([fallbackProject]);
      this.activeProjectIdSignal.set(fallbackProject.id);
      this.persistAppState();
      return fallbackProject;
    }

    const activeProjectId = this.activeProjectIdSignal().trim();
    const activeProject =
      projects.find((project) => project.id === activeProjectId) ?? projects[0];

    if (activeProject.id !== activeProjectId) {
      this.activeProjectIdSignal.set(activeProject.id);
      this.persistAppState();
    }

    return activeProject;
  }

  setActiveProject(projectId: string): void {
    const requestedId = projectId.trim();
    const projects = this.projectsSignal();

    if (projects.length === 0) {
      const fallbackProject = this.createGeneralProject([...this.shortcutsSignal()]);
      this.projectsSignal.set([fallbackProject]);
      this.activeProjectIdSignal.set(fallbackProject.id);
      this.shortcutsSignal.set([...fallbackProject.shortcuts]);
      this.persistAppState();
      return;
    }

    const nextProject =
      (requestedId ? projects.find((project) => project.id === requestedId) : undefined) ?? projects[0];

    this.activeProjectIdSignal.set(nextProject.id);
    this.shortcutsSignal.set([...nextProject.shortcuts]);
    this.persistAppState();
  }

  createProject(name: string): ShortcutOperationResult {
    const projectName = name.trim();
    if (!projectName) {
      return { success: false, error: 'El nombre del proyecto es obligatorio.' };
    }

    const project: ProjectItem = {
      id: this.createProjectId(),
      name: projectName,
      shortcuts: []
    };

    this.projectsSignal.update((current) => [...current, project]);
    this.activeProjectIdSignal.set(project.id);
    this.shortcutsSignal.set([]);
    this.ensureProjectStateConsistency();
    this.persistAppState();
    return { success: true };
  }

  renameProject(projectId: string, name: string): ShortcutOperationResult {
    const targetProjectId = projectId.trim();
    if (!targetProjectId) {
      return { success: false, error: 'No se encontro el proyecto a renombrar.' };
    }

    const projectName = name.trim();
    if (!projectName) {
      return { success: false, error: 'El nombre del proyecto es obligatorio.' };
    }

    let found = false;
    this.projectsSignal.update((projects) =>
      projects.map((project) => {
        if (project.id !== targetProjectId) {
          return project;
        }

        found = true;
        return {
          ...project,
          name: projectName
        };
      })
    );

    if (!found) {
      this.ensureProjectStateConsistency();
      this.persistAppState();
      return { success: false, error: 'No se encontro el proyecto a renombrar.' };
    }

    this.ensureProjectStateConsistency();
    this.persistAppState();
    return { success: true };
  }

  deleteProject(projectId: string): ShortcutOperationResult {
    const targetProjectId = projectId.trim();
    if (!targetProjectId) {
      return { success: false, error: 'No se encontro el proyecto a eliminar.' };
    }

    const projects = this.projectsSignal();
    if (projects.length <= 1) {
      return { success: false, error: 'Debe existir al menos un proyecto.' };
    }

    const nextProjects = projects.filter((project) => project.id !== targetProjectId);
    if (nextProjects.length === projects.length) {
      return { success: false, error: 'No se encontro el proyecto a eliminar.' };
    }

    this.projectsSignal.set(nextProjects);

    const currentActiveProjectId = this.activeProjectIdSignal().trim();
    const hasCurrentActive = currentActiveProjectId && nextProjects.some((project) => project.id === currentActiveProjectId);
    const nextActiveProjectId = hasCurrentActive ? currentActiveProjectId : nextProjects[0].id;
    const nextActiveProject = nextProjects.find((project) => project.id === nextActiveProjectId) ?? nextProjects[0];

    this.activeProjectIdSignal.set(nextActiveProject.id);
    this.shortcutsSignal.set([...nextActiveProject.shortcuts]);
    this.ensureProjectStateConsistency();
    this.persistAppState();
    return { success: true };
  }

  createCategory(name: string): ShortcutOperationResult {
    const categoryName = name.trim();
    if (!categoryName) {
      return { success: false, error: 'El nombre de la categoría es obligatorio.' };
    }

    const alreadyExists = this.categoriesSignal().some(
      (category) => category.name.toLowerCase() === categoryName.toLowerCase()
    );
    if (alreadyExists) {
      return { success: false, error: 'Ya existe una categoría con ese nombre.' };
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
      return { success: false, error: 'El nombre de la categoría es obligatorio.' };
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
      return { success: false, error: 'No se encontro la categoría a editar.' };
    }

    this.persistCategories();
    return { success: true };
  }

  deleteCategory(categoryId: string): ShortcutOperationResult {
    const exists = this.categoriesSignal().some((category) => category.id === categoryId);
    if (!exists) {
      return { success: false, error: 'No se encontro la categoría a eliminar.' };
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
      return { success: false, error: 'Hay categorías inválidas en el archivo.' };
    }

    const uniqueCategoryIds = new Set<string>();
    for (const category of normalizedCategories) {
      if (uniqueCategoryIds.has(category.id)) {
        return { success: false, error: 'Hay categorías duplicadas en el archivo.' };
      }
      uniqueCategoryIds.add(category.id);
    }

    const validCategoryIds = new Set(normalizedCategories.map((category) => category.id));
    const normalizedShortcuts = payload.shortcuts
      .map((shortcut) => this.normalizeShortcut(shortcut, validCategoryIds))
      .filter((shortcut): shortcut is Shortcut => shortcut !== null);
    if (normalizedShortcuts.length !== payload.shortcuts.length) {
      return { success: false, error: 'Hay accesos inválidos en el archivo.' };
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

  private loadAppState(): void {
    const validCategoryIds = new Set(this.categoriesSignal().map((category) => category.id));
    const storedAppState = this.storageService.getItem<unknown>(APP_STATE_STORAGE_KEY);
    const normalizedState = this.normalizeAppState(storedAppState, validCategoryIds);

    if (normalizedState) {
      this.projectsSignal.set(normalizedState.projects);
      this.activeProjectIdSignal.set(normalizedState.activeProjectId);
      this.shortcutsSignal.set(this.resolveActiveProjectShortcuts(normalizedState));
      this.persistAppState();
      return;
    }

    const storedLegacyShortcuts = this.storageService.getItem<unknown[]>(LEGACY_SHORTCUTS_STORAGE_KEY);
    const normalizedLegacyShortcuts = (storedLegacyShortcuts ?? [])
      .map((item) => this.normalizeShortcut(item, validCategoryIds))
      .filter((item): item is Shortcut => item !== null);

    const legacyShortcuts = normalizedLegacyShortcuts.length > 0 ? normalizedLegacyShortcuts : DEFAULT_SHORTCUTS;
    const migratedProject = this.createGeneralProject(legacyShortcuts);

    this.projectsSignal.set([migratedProject]);
    this.activeProjectIdSignal.set(GENERAL_PROJECT_ID);
    this.shortcutsSignal.set([...legacyShortcuts]);
    this.persistAppState();
  }

  private persistCategories(): void {
    this.storageService.setItem(CATEGORIES_STORAGE_KEY, this.categoriesSignal());
  }

  private persistShortcuts(): void {
    this.syncActiveProjectShortcuts();
    this.persistAppState();
  }

  private syncActiveProjectShortcuts(): void {
    const activeProjectId = this.activeProjectIdSignal();
    const currentShortcuts = this.shortcutsSignal();

    this.projectsSignal.update((projects) =>
      projects.map((project) =>
        project.id === activeProjectId
          ? {
              ...project,
              shortcuts: [...currentShortcuts]
            }
          : project
      )
    );
  }

  private persistAppState(): void {
    const activeProjectId = this.activeProjectIdSignal();
    const projects = this.projectsSignal();
    this.storageService.setItem<AppState>(APP_STATE_STORAGE_KEY, {
      projects,
      activeProjectId: projects.some((project) => project.id === activeProjectId) ? activeProjectId : projects[0]?.id ?? GENERAL_PROJECT_ID
    });
  }

  private resolveActiveProjectShortcuts(state: AppState): Shortcut[] {
    const activeProject = state.projects.find((project) => project.id === state.activeProjectId) ?? state.projects[0];
    return activeProject ? [...activeProject.shortcuts] : [];
  }

  private getActiveProjectShortcuts(): Shortcut[] {
    const activeProject = this.getActiveProject();
    const currentShortcuts = this.shortcutsSignal();

    if (activeProject.id === this.activeProjectIdSignal()) {
      return [...currentShortcuts];
    }

    return [...activeProject.shortcuts];
  }

  private ensureProjectStateConsistency(): void {
    let projects = this.projectsSignal();

    if (projects.length === 0) {
      const fallbackProject = this.createGeneralProject([...this.shortcutsSignal()]);
      this.projectsSignal.set([fallbackProject]);
      projects = [fallbackProject];
    }

    const activeProjectId = this.activeProjectIdSignal().trim();
    const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0];

    if (activeProject.id !== activeProjectId) {
      this.activeProjectIdSignal.set(activeProject.id);
    }

    this.shortcutsSignal.set([...activeProject.shortcuts]);
  }

  private normalizeAppState(raw: unknown, validCategoryIds: Set<string>): AppState | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as Record<string, unknown>;
    if (!Array.isArray(source['projects'])) {
      return null;
    }

    const normalizedProjects = source['projects']
      .map((project) => this.normalizeProject(project, validCategoryIds))
      .filter((project): project is ProjectItem => project !== null);
    if (normalizedProjects.length === 0) {
      return null;
    }

    const activeProjectIdRaw = typeof source['activeProjectId'] === 'string' ? source['activeProjectId'].trim() : '';
    const activeProjectId =
      activeProjectIdRaw && normalizedProjects.some((project) => project.id === activeProjectIdRaw)
        ? activeProjectIdRaw
        : normalizedProjects[0].id;

    return {
      projects: normalizedProjects,
      activeProjectId
    };
  }

  private normalizeProject(raw: unknown, validCategoryIds: Set<string>): ProjectItem | null {
    if (!raw || typeof raw !== 'object') {
      return null;
    }

    const source = raw as Record<string, unknown>;
    const id = typeof source['id'] === 'string' ? source['id'].trim() : '';
    const name = typeof source['name'] === 'string' ? source['name'].trim() : '';
    const shortcutsSource = Array.isArray(source['shortcuts']) ? source['shortcuts'] : [];

    if (!id || !name) {
      return null;
    }

    const shortcuts = shortcutsSource
      .map((item) => this.normalizeShortcut(item, validCategoryIds))
      .filter((item): item is Shortcut => item !== null);

    return {
      id,
      name,
      shortcuts
    };
  }

  private createGeneralProject(shortcuts: Shortcut[]): ProjectItem {
    return {
      id: GENERAL_PROJECT_ID,
      name: GENERAL_PROJECT_NAME,
      shortcuts: [...shortcuts]
    };
  }

  private validateInput(input: ShortcutUpsertInput): ShortcutOperationResult {
    if (!input.name?.trim()) {
      return { success: false, error: 'El nombre es obligatorio.' };
    }

    if (!this.isValidShortcutType(input.type)) {
      return { success: false, error: 'El tipo de acceso no es válido.' };
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

  private createProjectId(): string {
    return `pr-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
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
    const includeInProjectLaunch =
      typeof source['includeInProjectLaunch'] === 'boolean' ? source['includeInProjectLaunch'] : false;
    const normalizedCategoryId = categoryId && validCategoryIds.has(categoryId) ? categoryId : '';

    return {
      id,
      name: name.trim(),
      type,
      value: normalizedValue,
      isFavorite,
      includeInProjectLaunch,
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

