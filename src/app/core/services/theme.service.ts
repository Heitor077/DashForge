import { DOCUMENT } from '@angular/common';
import { Injectable, computed, inject, signal } from '@angular/core';

import { DEFAULT_SETTINGS, DEFAULT_THEMES, DEFAULT_WALLPAPERS } from '../data/default-data';
import { VISUAL_PRESETS } from '../data/visual-presets';
import {
  DashboardPreferences,
  DashboardLayoutOptions,
  DashboardOpenBehavior,
  DashboardSettings,
  DashboardVisualDensity,
  DEFAULT_DASHBOARD_LAYOUT_OPTIONS,
  DEFAULT_DASHBOARD_PREFERENCES
} from '../models/dashboard-settings.model';
import { ThemeDefinition, ThemeVariant } from '../models/theme-definition.model';
import { VisualPreset, VisualPresetOverlay } from '../models/visual-preset.model';
import { Wallpaper } from '../models/wallpaper.model';
import { StorageService } from './storage.service';

const SETTINGS_STORAGE_KEY = 'dashboard.settings';
const CUSTOM_PRESETS_STORAGE_KEY = 'dashboard.custom-presets';

interface ThemeImportValidationResult {
  success: boolean;
  error?: string;
  settings?: DashboardSettings;
  customPresets?: VisualPreset[];
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly storageService = inject(StorageService);

  private readonly themesSignal = signal<ThemeDefinition[]>(DEFAULT_THEMES);
  private readonly wallpapersSignal = signal<Wallpaper[]>(DEFAULT_WALLPAPERS);
  private readonly presetsSignal = signal<VisualPreset[]>(VISUAL_PRESETS);
  private readonly customPresetsSignal = signal<VisualPreset[]>([]);
  private readonly settingsSignal = signal<DashboardSettings>(DEFAULT_SETTINGS);
  private transitionTimeoutId: number | null = null;

  readonly themes = computed(() => this.themesSignal());
  readonly wallpapers = computed(() => this.wallpapersSignal());
  readonly presets = computed(() => [...this.presetsSignal(), ...this.customPresetsSignal()]);
  readonly systemPresets = computed(() => this.presetsSignal());
  readonly userPresets = computed(() => this.customPresetsSignal());
  readonly settings = computed(() => this.settingsSignal());
  readonly activeThemeId = computed(() => this.settingsSignal().themeId);
  readonly activeVariantId = computed(() => this.settingsSignal().themeVariantId);
  readonly activeWallpaperId = computed(() => this.settingsSignal().wallpaperId);
  readonly activeTheme = computed(() => this.findThemeById(this.activeThemeId()) ?? DEFAULT_THEMES[0]);
  readonly activeWallpaper = computed(
    () => this.findWallpaperById(this.activeWallpaperId()) ?? DEFAULT_WALLPAPERS[0]
  );
  readonly activeVariants = computed(() => this.activeTheme().variants);
  readonly activePresetId = computed(() => this.settingsSignal().preferences?.activePresetId ?? '');
  readonly activePreset = computed(() => this.findPresetById(this.activePresetId()));

  initialize(): void {
    this.loadCustomPresets();
    const savedSettings = this.storageService.getItem<DashboardSettings>(SETTINGS_STORAGE_KEY);
    const nextSettings = this.normalizeSettings(savedSettings ?? DEFAULT_SETTINGS);
    this.settingsSignal.set(nextSettings);
    this.applyCurrentSelection();
  }

  setTheme(themeId: string): void {
    const theme = this.findThemeById(themeId);
    if (!theme) {
      return;
    }

    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      themeId: theme.id,
      themeVariantId: theme.defaultVariantId,
      preferences: this.clearActivePreset(this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES)
    };

    this.persistAndApply(nextSettings);
  }

  setThemeVariant(variantId: string): void {
    const variant = this.findGlobalVariantById(variantId);
    if (!variant) {
      return;
    }

    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      themeVariantId: variant.id,
      preferences: this.clearActivePreset(this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES)
    };

    this.persistAndApply(nextSettings);
  }

  setWallpaper(wallpaperId: string): void {
    const wallpaper = this.findWallpaperById(wallpaperId);
    if (!wallpaper) {
      return;
    }

    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      wallpaperId: wallpaper.id,
      preferences: this.clearActivePreset(this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES)
    };

    this.persistAndApply(nextSettings, { animateWallpaper: true });
  }

  toggleTheme(): void {
    const themes = this.themesSignal();
    const currentIndex = themes.findIndex((theme) => theme.id === this.activeThemeId());
    const nextTheme = themes[(currentIndex + 1) % themes.length];
    this.setTheme(nextTheme.id);
  }

  setLayoutOptions(layoutOptions: Partial<DashboardLayoutOptions>): void {
    const currentLayout = this.settingsSignal().layoutOptions ?? DEFAULT_DASHBOARD_LAYOUT_OPTIONS;
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      layoutOptions: {
        ...currentLayout,
        ...layoutOptions
      }
    };
    this.persistAndApply(nextSettings);
  }

  setVisualDensity(visualDensity: DashboardVisualDensity): void {
    const currentPreferences = this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      preferences: {
        ...this.clearActivePreset(currentPreferences),
        visualDensity
      }
    };
    this.persistAndApply(nextSettings);
  }

  setShowShortcutLabels(showShortcutLabels: boolean): void {
    const currentPreferences = this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      preferences: {
        ...currentPreferences,
        showShortcutLabels
      }
    };
    this.persistAndApply(nextSettings);
  }

  setOpenBehavior(openBehavior: DashboardOpenBehavior): void {
    const currentPreferences = this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      preferences: {
        ...currentPreferences,
        openBehavior
      }
    };
    this.persistAndApply(nextSettings);
  }

  setWallpaperBlurPx(wallpaperBlurPx: number): void {
    const currentPreferences = this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const sanitizedBlur = Math.max(0, Math.min(16, Math.round(wallpaperBlurPx)));
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      preferences: {
        ...this.clearActivePreset(currentPreferences),
        wallpaperBlurPx: sanitizedBlur
      }
    };
    this.persistAndApply(nextSettings);
  }

  applyVisualPreset(presetId: string): void {
    const preset = this.findPresetById(presetId);
    if (!preset) {
      return;
    }

    const theme = this.findThemeById(preset.config.themeId);
    const wallpaper = this.findWallpaperById(preset.config.wallpaperId);
    if (!theme || !wallpaper) {
      return;
    }
    const requestedVariant = preset.config.themeVariantId.trim();
    const variant =
      this.findGlobalVariantById(requestedVariant) ??
      theme.variants.find((item) => item.id === theme.defaultVariantId) ??
      theme.variants[0];

    const currentPreferences = this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const normalizedCustomWallpaperSource = this.normalizeCustomWallpaperSource(
      preset.config.customWallpaperSource ?? ''
    );
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      themeId: theme.id,
      themeVariantId: variant.id,
      wallpaperId: wallpaper.id,
      preferences: {
        ...currentPreferences,
        activePresetId: preset.id,
        visualDensity: preset.config.visualDensity ?? currentPreferences.visualDensity,
        wallpaperBlurPx: preset.config.blur ?? 0,
        surfaceOpacity: this.normalizeSurfaceOpacity(preset.config.surfaceOpacity),
        wallpaperOverlayColor: preset.config.overlay?.color?.trim() ?? '',
        wallpaperOverlayOpacity:
          preset.config.overlay?.opacity === undefined ? -1 : this.normalizeOpacity(preset.config.overlay.opacity),
        customWallpaperSource:
          preset.config.wallpaperId === 'custom-image'
            ? normalizedCustomWallpaperSource || currentPreferences.customWallpaperSource
            : ''
      }
    };

    this.persistAndApply(nextSettings, { animateWallpaper: true });
  }

  createCustomPreset(rawLabel: string): { success: boolean; error?: string; preset?: VisualPreset } {
    const label = this.sanitizePresetLabel(rawLabel);
    if (!label) {
      return { success: false, error: 'Escribe un nombre para guardar el preset.' };
    }

    const presetId = this.createCustomPresetId(label);
    const preset = this.buildCustomPresetFromCurrentSettings({ id: presetId, label });
    const nextCustomPresets = [...this.customPresetsSignal(), preset];
    this.persistCustomPresets(nextCustomPresets);

    const currentSettings = this.settingsSignal();
    const nextSettings: DashboardSettings = {
      ...currentSettings,
      preferences: {
        ...(currentSettings.preferences ?? DEFAULT_DASHBOARD_PREFERENCES),
        activePresetId: preset.id
      }
    };
    this.persistAndApply(nextSettings);

    return { success: true, preset };
  }

  updateCustomPreset(
    presetId: string,
    rawLabel?: string
  ): { success: boolean; error?: string; preset?: VisualPreset } {
    const currentPreset = this.customPresetsSignal().find((preset) => preset.id === presetId);
    if (!currentPreset) {
      return { success: false, error: 'El preset personalizado no existe.' };
    }

    const label = rawLabel === undefined ? currentPreset.label : this.sanitizePresetLabel(rawLabel);
    if (!label) {
      return { success: false, error: 'Escribe un nombre válido para el preset.' };
    }

    const nextPreset = this.buildCustomPresetFromCurrentSettings({
      id: currentPreset.id,
      label,
      createdAt: currentPreset.createdAt
    });
    const nextCustomPresets = this.customPresetsSignal().map((preset) =>
      preset.id === presetId ? nextPreset : preset
    );
    this.persistCustomPresets(nextCustomPresets);

    const currentSettings = this.settingsSignal();
    const nextSettings: DashboardSettings = {
      ...currentSettings,
      preferences: {
        ...(currentSettings.preferences ?? DEFAULT_DASHBOARD_PREFERENCES),
        activePresetId: nextPreset.id
      }
    };
    this.persistAndApply(nextSettings);

    return { success: true, preset: nextPreset };
  }

  deleteCustomPreset(presetId: string): { success: boolean; error?: string } {
    const customPresetExists = this.customPresetsSignal().some((preset) => preset.id === presetId);
    if (!customPresetExists) {
      return { success: false, error: 'Solo se pueden eliminar presets personalizados.' };
    }

    const nextCustomPresets = this.customPresetsSignal().filter((preset) => preset.id !== presetId);
    this.persistCustomPresets(nextCustomPresets);

    const currentSettings = this.settingsSignal();
    const currentPreferences = currentSettings.preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    if (currentPreferences.activePresetId !== presetId) {
      return { success: true };
    }

    const nextSettings: DashboardSettings = {
      ...currentSettings,
      preferences: this.clearActivePreset(currentPreferences)
    };
    this.persistAndApply(nextSettings);
    return { success: true };
  }

  setCustomWallpaper(rawSource: string): void {
    const currentPreferences = this.settingsSignal().preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const normalizedSource = this.normalizeCustomWallpaperSource(rawSource);
    const currentWallpaperId = this.settingsSignal().wallpaperId;
    const fallbackWallpaperId = this.wallpapersSignal().find((wallpaper) => wallpaper.id !== 'custom-image')?.id ?? DEFAULT_WALLPAPERS[0].id;
    const nextWallpaperId =
      normalizedSource
        ? 'custom-image'
        : currentWallpaperId === 'custom-image'
          ? fallbackWallpaperId
          : currentWallpaperId;
    const nextSettings: DashboardSettings = {
      ...this.settingsSignal(),
      wallpaperId: nextWallpaperId,
      preferences: {
        ...this.clearActivePreset(currentPreferences),
        customWallpaperSource: normalizedSource
      }
    };
    this.persistAndApply(nextSettings, { animateWallpaper: true });
  }

  getSnapshot(): {
    settings: DashboardSettings;
    visualState: { themeId: string; wallpaperId: string; presetId: string };
    customPresets: VisualPreset[];
  } {
    const settings = this.settingsSignal();
    const snapshotSettings: DashboardSettings = {
      ...settings,
      layoutOptions: {
        ...DEFAULT_DASHBOARD_LAYOUT_OPTIONS,
        ...settings.layoutOptions
      },
      preferences: {
        ...DEFAULT_DASHBOARD_PREFERENCES,
        ...settings.preferences
      }
    };

    return {
      settings: snapshotSettings,
      visualState: {
        themeId: settings.themeId,
        wallpaperId: settings.wallpaperId,
        presetId: settings.preferences?.activePresetId ?? ''
      },
      customPresets: [...this.customPresetsSignal()]
    };
  }

  validateImportedConfiguration(payload: {
    settings: DashboardSettings;
    visualState?: { themeId?: string; wallpaperId?: string; presetId?: string };
    customPresets?: VisualPreset[];
  }): ThemeImportValidationResult {
    const normalizedCustomPresets = this.normalizeImportedCustomPresets(payload.customPresets ?? []);
    if (normalizedCustomPresets.length !== (payload.customPresets ?? []).length) {
      return { success: false, error: 'Hay presets personalizados inválidos en el archivo.' };
    }

    const presetIds = new Set<string>();
    const systemPresetIds = new Set(this.presetsSignal().map((preset) => preset.id));
    for (const preset of normalizedCustomPresets) {
      if (presetIds.has(preset.id)) {
        return { success: false, error: 'Hay presets personalizados duplicados en el archivo.' };
      }
      if (systemPresetIds.has(preset.id)) {
        return { success: false, error: 'Un preset personalizado usa un id reservado del sistema.' };
      }
      presetIds.add(preset.id);
    }

    const visualState = payload.visualState ?? {};
    const settingsWithVisualState: DashboardSettings = {
      ...payload.settings,
      themeId: typeof visualState.themeId === 'string' && visualState.themeId.trim() ? visualState.themeId : payload.settings.themeId,
      wallpaperId:
        typeof visualState.wallpaperId === 'string' && visualState.wallpaperId.trim()
          ? visualState.wallpaperId
          : payload.settings.wallpaperId,
      preferences: {
        ...DEFAULT_DASHBOARD_PREFERENCES,
        ...payload.settings.preferences,
        activePresetId:
          typeof visualState.presetId === 'string'
            ? visualState.presetId.trim()
            : payload.settings.preferences?.activePresetId ?? ''
      }
    };

    const normalizedSettings = this.normalizeSettings(settingsWithVisualState);
    const normalizedPreferences = {
      ...DEFAULT_DASHBOARD_PREFERENCES,
      ...normalizedSettings.preferences
    };
    const hasActivePreset = normalizedPreferences.activePresetId.trim();
    if (hasActivePreset) {
      const availablePresetIds = new Set(
        [...this.presetsSignal(), ...normalizedCustomPresets].map((preset) => preset.id)
      );
      if (!availablePresetIds.has(normalizedPreferences.activePresetId)) {
        normalizedPreferences.activePresetId = '';
      }
    }

    normalizedSettings.preferences = normalizedPreferences;

    return {
      success: true,
      settings: normalizedSettings,
      customPresets: normalizedCustomPresets
    };
  }

  applyImportedConfiguration(payload: {
    settings: DashboardSettings;
    visualState?: { themeId?: string; wallpaperId?: string; presetId?: string };
    customPresets?: VisualPreset[];
  }): ThemeImportValidationResult {
    const validation = this.validateImportedConfiguration(payload);
    if (!validation.success || !validation.settings || !validation.customPresets) {
      return validation;
    }

    this.customPresetsSignal.set(validation.customPresets);
    this.storageService.setItem(CUSTOM_PRESETS_STORAGE_KEY, validation.customPresets);
    this.persistAndApply(validation.settings, { animateWallpaper: true });
    return { success: true };
  }

  private persistAndApply(settings: DashboardSettings, options?: { animateWallpaper?: boolean }): void {
    this.startUiTransition();

    if (options?.animateWallpaper) {
      this.animateWallpaperTransition();
    }

    this.settingsSignal.set(settings);
    this.storageService.setItem(SETTINGS_STORAGE_KEY, settings);
    this.applyCurrentSelection();

    if (options?.animateWallpaper) {
      this.finishWallpaperTransition();
    }
  }

  private startUiTransition(): void {
    const rootElement = this.document.documentElement;
    rootElement.setAttribute('data-ui-transition', 'active');

    if (this.transitionTimeoutId !== null) {
      window.clearTimeout(this.transitionTimeoutId);
    }

    this.transitionTimeoutId = window.setTimeout(() => {
      rootElement.removeAttribute('data-ui-transition');
      this.transitionTimeoutId = null;
    }, 260);
  }

  private applyCurrentSelection(): void {
    const rootElement = this.document.documentElement;
    const theme = this.activeTheme();
    const variant =
      this.findGlobalVariantById(this.activeVariantId()) ??
      theme.variants.find((item) => item.id === theme.defaultVariantId) ??
      theme.variants[0];
    const wallpaper = this.resolveActiveWallpaper();
    const userBlur = this.settingsSignal().preferences?.wallpaperBlurPx ?? DEFAULT_DASHBOARD_PREFERENCES.wallpaperBlurPx;
    const totalBlur = Math.max(0, (wallpaper.blurPx ?? 0) + userBlur);
    const overlayColor = this.settingsSignal().preferences?.wallpaperOverlayColor?.trim() || wallpaper.overlay.color;
    const overlayOpacityOverride = this.settingsSignal().preferences?.wallpaperOverlayOpacity ?? -1;
    const overlayOpacity = overlayOpacityOverride >= 0 ? overlayOpacityOverride : wallpaper.overlay.opacity;
    const surfaceOpacity = this.normalizeSurfaceOpacity(this.settingsSignal().preferences?.surfaceOpacity);

    const mergedVariables = { ...theme.baseVariables, ...variant.variables };
    Object.entries(mergedVariables).forEach(([property, value]) => {
      rootElement.style.setProperty(property, value);
    });

    rootElement.style.setProperty('--app-wallpaper-image', wallpaper.value);
    rootElement.style.setProperty('--app-wallpaper-position', wallpaper.position ?? 'center');
    rootElement.style.setProperty('--app-wallpaper-size', wallpaper.size ?? 'cover');
    rootElement.style.setProperty('--app-wallpaper-overlay-color', overlayColor);
    rootElement.style.setProperty('--app-wallpaper-overlay-opacity', `${overlayOpacity}`);
    rootElement.style.setProperty('--app-wallpaper-blur', `${totalBlur}px`);
    rootElement.style.setProperty('--app-surface-opacity', `${Math.round(surfaceOpacity * 100)}%`);
    rootElement.style.setProperty('--app-wallpaper-video-poster', wallpaper.video?.poster ?? 'none');
    rootElement.style.setProperty(
      '--shortcut-card-padding',
      this.settingsSignal().preferences?.visualDensity === 'compact' ? '10px' : '14px'
    );
    rootElement.style.setProperty(
      '--shortcut-card-actions-padding',
      this.settingsSignal().preferences?.visualDensity === 'compact' ? '8px 10px 10px' : '10px 14px 12px'
    );

    rootElement.setAttribute('data-theme', theme.id);
    rootElement.setAttribute('data-theme-variant', variant.id);
    rootElement.setAttribute('data-wallpaper-type', wallpaper.type);
  }

  private normalizeSettings(settings: DashboardSettings): DashboardSettings {
    const theme = this.findThemeById(settings.themeId) ?? DEFAULT_THEMES[0];
    const variant =
      this.findGlobalVariantById(settings.themeVariantId) ??
      theme.variants.find((item) => item.id === theme.defaultVariantId) ??
      theme.variants[0];
    const wallpaper = this.findWallpaperById(settings.wallpaperId) ?? DEFAULT_WALLPAPERS[0];

    return {
      ...settings,
      themeId: theme.id,
      themeVariantId: variant.id,
      wallpaperId: wallpaper.id,
      layoutOptions: {
        ...DEFAULT_DASHBOARD_LAYOUT_OPTIONS,
        ...settings.layoutOptions
      },
      preferences: {
        ...DEFAULT_DASHBOARD_PREFERENCES,
        ...settings.preferences
      }
    };
  }

  private loadCustomPresets(): void {
    const storedPresets = this.storageService.getItem<unknown[]>(CUSTOM_PRESETS_STORAGE_KEY) ?? [];
    const normalizedPresets = this.normalizeImportedCustomPresets(storedPresets);
    this.customPresetsSignal.set(normalizedPresets);
    this.storageService.setItem(CUSTOM_PRESETS_STORAGE_KEY, normalizedPresets);
  }

  private persistCustomPresets(customPresets: VisualPreset[]): void {
    this.customPresetsSignal.set(customPresets);
    this.storageService.setItem(CUSTOM_PRESETS_STORAGE_KEY, customPresets);
  }

  private findThemeById(themeId: string): ThemeDefinition | undefined {
    return this.themesSignal().find((theme) => theme.id === themeId);
  }

  private findGlobalVariantById(variantId: string): ThemeVariant | undefined {
    const normalizedVariantId = variantId.trim();
    if (!normalizedVariantId) {
      return undefined;
    }

    for (const theme of this.themesSignal()) {
      const variant = theme.variants.find((item) => item.id === normalizedVariantId);
      if (variant) {
        return variant;
      }
    }

    return undefined;
  }

  private findWallpaperById(wallpaperId: string): Wallpaper | undefined {
    return this.wallpapersSignal().find((wallpaper) => wallpaper.id === wallpaperId);
  }

  private findPresetById(presetId: string): VisualPreset | undefined {
    return this.presets().find((preset) => preset.id === presetId);
  }

  private resolveActiveWallpaper(): Wallpaper {
    const wallpaper = this.activeWallpaper();
    const customSource = this.settingsSignal().preferences?.customWallpaperSource;

    if (wallpaper.id !== 'custom-image' || !customSource) {
      return wallpaper;
    }

    return {
      ...wallpaper,
      value: customSource
    };
  }

  private normalizeCustomWallpaperSource(rawSource: string): string {
    const trimmedSource = rawSource.trim();
    if (!trimmedSource) {
      return '';
    }

    if (
      trimmedSource.startsWith('linear-gradient(') ||
      trimmedSource.startsWith('radial-gradient(') ||
      trimmedSource.startsWith('conic-gradient(')
    ) {
      return trimmedSource;
    }

    const normalizedRawValue = this.unwrapCssUrl(trimmedSource);
    if (
      normalizedRawValue.startsWith('linear-gradient(') ||
      normalizedRawValue.startsWith('radial-gradient(') ||
      normalizedRawValue.startsWith('conic-gradient(')
    ) {
      return normalizedRawValue;
    }

    const sanitizedUrl = normalizedRawValue.replace(/"/g, '');
    return sanitizedUrl ? `url("${sanitizedUrl}")` : '';
  }

  private unwrapCssUrl(rawValue: string): string {
    let value = rawValue.trim();

    for (let depth = 0; depth < 4; depth += 1) {
      const normalizedValue = value.toLowerCase();
      if (!normalizedValue.startsWith('url(') || !value.endsWith(')')) {
        break;
      }

      const innerValue = value.slice(4, -1).trim();
      value = innerValue.replace(/^['"]|['"]$/g, '').trim();
    }

    return value;
  }

  private sanitizePresetLabel(rawLabel: string): string {
    return rawLabel.trim().replace(/\s+/g, ' ');
  }

  private createCustomPresetId(label: string): string {
    const slug = label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48);
    const prefix = slug || 'preset';
    const presetId = `user-${prefix}`;
    const allPresetIds = new Set(this.presets().map((preset) => preset.id));

    if (!allPresetIds.has(presetId)) {
      return presetId;
    }

    let suffix = 2;
    while (allPresetIds.has(`${presetId}-${suffix}`)) {
      suffix += 1;
    }

    return `${presetId}-${suffix}`;
  }

  private buildCustomPresetFromCurrentSettings(seed: {
    id: string;
    label: string;
    createdAt?: string;
  }): VisualPreset {
    const settings = this.settingsSignal();
    const preferences = settings.preferences ?? DEFAULT_DASHBOARD_PREFERENCES;
    const now = new Date().toISOString();
    const customWallpaperSource = this.normalizeCustomWallpaperSource(preferences.customWallpaperSource ?? '');

    return {
      id: seed.id,
      label: seed.label,
      source: 'user',
      isCustom: true,
      createdAt: seed.createdAt ?? now,
      updatedAt: now,
      config: {
        themeId: settings.themeId,
        themeVariantId: settings.themeVariantId,
        wallpaperId: settings.wallpaperId,
        blur: Math.max(0, Math.round(preferences.wallpaperBlurPx ?? 0)),
        surfaceOpacity: this.normalizeSurfaceOpacity(preferences.surfaceOpacity),
        overlay: {
          color: preferences.wallpaperOverlayColor?.trim() || undefined,
          opacity:
            preferences.wallpaperOverlayOpacity >= 0
              ? this.normalizeOpacity(preferences.wallpaperOverlayOpacity)
              : undefined
        },
        visualDensity: preferences.visualDensity,
        customWallpaperSource:
          settings.wallpaperId === 'custom-image' ? customWallpaperSource || undefined : undefined
      }
    };
  }

  private clearActivePreset(preferences: DashboardPreferences): DashboardPreferences {
    return {
      ...preferences,
      activePresetId: ''
    };
  }

  private normalizeSurfaceOpacity(surfaceOpacity: number | undefined): number {
    if (surfaceOpacity === undefined || Number.isNaN(surfaceOpacity)) {
      return DEFAULT_DASHBOARD_PREFERENCES.surfaceOpacity;
    }

    return Math.max(0.72, Math.min(0.96, surfaceOpacity));
  }

  private normalizeOpacity(opacity: number): number {
    return Math.max(0, Math.min(0.75, opacity));
  }

  private animateWallpaperTransition(): void {
    this.document.documentElement.style.setProperty('--app-wallpaper-layer-opacity', '0');
  }

  private finishWallpaperTransition(): void {
    const applyVisibleLayer = () => {
      this.document.documentElement.style.setProperty('--app-wallpaper-layer-opacity', '1');
    };

    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(applyVisibleLayer);
      return;
    }

    applyVisibleLayer();
  }

  private normalizeImportedCustomPresets(rawPresets: unknown[]): VisualPreset[] {
    const normalized: VisualPreset[] = [];

    rawPresets.forEach((rawPreset) => {
      const preset = this.normalizeImportedCustomPreset(rawPreset);
      if (preset) {
        normalized.push(preset);
      }
    });

    return normalized;
  }

  private normalizeImportedCustomPreset(rawPreset: unknown): VisualPreset | null {
    if (!rawPreset || typeof rawPreset !== 'object') {
      return null;
    }

    const source = rawPreset as Record<string, unknown>;
    const id = typeof source['id'] === 'string' ? source['id'].trim() : '';
    const label = typeof source['label'] === 'string' ? source['label'].trim() : '';
    const configSource =
      source['config'] && typeof source['config'] === 'object'
        ? (source['config'] as Record<string, unknown>)
        : source;
    const themeId = typeof configSource['themeId'] === 'string' ? configSource['themeId'].trim() : '';
    const themeVariantId = typeof configSource['themeVariantId'] === 'string' ? configSource['themeVariantId'].trim() : '';
    const wallpaperId = typeof configSource['wallpaperId'] === 'string' ? configSource['wallpaperId'].trim() : '';
    const description = typeof source['description'] === 'string' ? source['description'].trim() : '';
    const blur =
      typeof configSource['blur'] === 'number' && Number.isFinite(configSource['blur'])
        ? Math.max(0, configSource['blur'])
        : undefined;
    const surfaceOpacity =
      typeof configSource['surfaceOpacity'] === 'number' && Number.isFinite(configSource['surfaceOpacity'])
        ? this.normalizeSurfaceOpacity(configSource['surfaceOpacity'])
        : undefined;
    const visualDensity =
      configSource['visualDensity'] === 'comfortable' || configSource['visualDensity'] === 'compact'
        ? configSource['visualDensity']
        : undefined;
    const customWallpaperSource =
      typeof configSource['customWallpaperSource'] === 'string'
        ? this.normalizeCustomWallpaperSource(configSource['customWallpaperSource'])
        : '';
    const createdAt = typeof source['createdAt'] === 'string' ? source['createdAt'] : undefined;
    const updatedAt = typeof source['updatedAt'] === 'string' ? source['updatedAt'] : undefined;

    if (!id || !label || !themeId || !wallpaperId) {
      return null;
    }

    const theme = this.findThemeById(themeId);
    if (!theme || !this.findWallpaperById(wallpaperId)) {
      return null;
    }
    if (this.presetsSignal().some((preset) => preset.id === id)) {
      return null;
    }

    const rawOverlay = configSource['overlay'];
    let overlay: VisualPresetOverlay | undefined;
    if (rawOverlay && typeof rawOverlay === 'object') {
      const overlaySource = rawOverlay as Record<string, unknown>;
      const color = typeof overlaySource['color'] === 'string' ? overlaySource['color'].trim() : '';
      const opacity =
        typeof overlaySource['opacity'] === 'number' && Number.isFinite(overlaySource['opacity'])
          ? this.normalizeOpacity(overlaySource['opacity'])
          : undefined;
      if (color || opacity !== undefined) {
        overlay = {
          color: color || undefined,
          opacity
        };
      }
    }

    return {
      id,
      label,
      description: description || undefined,
      config: {
        themeId,
        themeVariantId:
          this.findGlobalVariantById(themeVariantId)?.id ?? theme.defaultVariantId,
        wallpaperId,
        overlay,
        blur,
        surfaceOpacity,
        visualDensity,
        customWallpaperSource: customWallpaperSource || undefined
      },
      createdAt,
      updatedAt,
      isCustom: true,
      source: 'user'
    };
  }
}

