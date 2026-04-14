import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DashboardOpenBehavior, DashboardVisualDensity } from '../../../../core/models/dashboard-settings.model';
import { VisualPreset } from '../../../../core/models/visual-preset.model';
import { LauncherConfigService } from '../../../../core/services/launcher-config.service';
import { LauncherService } from '../../../../core/services/launcher.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { ThemeService } from '../../../../core/services/theme.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [RouterLink, DatePipe],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.css'
})
export class SettingsPageComponent {
  private static readonly MAX_CUSTOM_WALLPAPER_BYTES = 8 * 1024 * 1024;
  private static readonly VISIBLE_VARIANTS_LIMIT = 8;
  private static readonly AUTO_COLUMNS_VALUE = 0;

  readonly themeService = inject(ThemeService);
  readonly launcherService = inject(LauncherService);
  readonly launcherConfigService = inject(LauncherConfigService);
  readonly notificationService = inject(NotificationService);

  readonly themes = this.themeService.themes;
  readonly activeTheme = this.themeService.activeTheme;
  readonly activeVariants = this.themeService.activeVariants;
  readonly wallpapers = this.themeService.wallpapers;
  readonly presets = this.themeService.presets;
  readonly systemPresets = this.themeService.systemPresets;
  readonly userPresets = this.themeService.userPresets;
  readonly settings = this.themeService.settings;
  readonly activePresetId = this.themeService.activePresetId;

  readonly layoutColumns = computed(() => this.settings().layoutOptions?.columns ?? 3);
  readonly isAutoLayoutColumns = computed(() => this.layoutColumns() === SettingsPageComponent.AUTO_COLUMNS_VALUE);
  readonly isCompactMode = computed(() => this.settings().layoutOptions?.compactMode ?? false);
  readonly visualDensity = computed(() => this.settings().preferences?.visualDensity ?? 'comfortable');
  readonly showShortcutLabels = computed(() => this.settings().preferences?.showShortcutLabels ?? true);
  readonly openBehavior = computed(() => this.settings().preferences?.openBehavior ?? 'new-tab');
  readonly wallpaperBlurPx = computed(() => this.settings().preferences?.wallpaperBlurPx ?? 0);
  readonly customWallpaperSource = computed(() => this.settings().preferences?.customWallpaperSource ?? '');
  readonly customWallpaperPreview = computed(() => {
    const source = this.customWallpaperSource().trim();
    if (!source) {
      return '';
    }

    if (source.startsWith('linear-gradient(') || source.startsWith('radial-gradient(')) {
      return source;
    }

    if (source.startsWith('url(')) {
      return source;
    }

    return `url("${source.replace(/"/g, '')}")`;
  });

  readonly densityOptions: DashboardVisualDensity[] = ['comfortable', 'compact'];
  readonly openBehaviorOptions: DashboardOpenBehavior[] = ['new-tab', 'same-tab', 'system'];
  readonly densityOptionMeta: Array<{ id: DashboardVisualDensity; title: string; description: string }> = [
    {
      id: 'comfortable',
      title: 'Confortable',
      description: 'Mas aire visual y separacion entre elementos.'
    },
    {
      id: 'compact',
      title: 'Compacta',
      description: 'Mas informacion visible en el mismo espacio.'
    }
  ];
  readonly openBehaviorOptionMeta: Array<{ id: DashboardOpenBehavior; title: string; description: string }> = [
    {
      id: 'new-tab',
      title: 'new-tab',
      description: 'Abre cada acceso en una pestaña nueva.'
    },
    {
      id: 'same-tab',
      title: 'same-tab',
      description: 'Reutiliza la pestaña actual para abrir.'
    },
    {
      id: 'system',
      title: 'system',
      description: 'Usa el comportamiento predeterminado del sistema.'
    }
  ];
  readonly launcherCapabilities = this.launcherService.capabilities;
  readonly isImporting = signal(false);
  readonly isImportFormatHelpOpen = signal(false);
  readonly selectedUserPresetId = signal('');
  readonly isConfirmDeleteOpen = signal(false);
  readonly highlightedPresetId = signal('');
  readonly areExtraVariantsOpen = signal(false);
  readonly visibleVariantLimit = SettingsPageComponent.VISIBLE_VARIANTS_LIMIT;
  readonly wallpaperValueById = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    this.wallpapers().forEach((wallpaper) => {
      map[wallpaper.id] = wallpaper.value;
    });
    return map;
  });
  readonly globalVariants = computed(() => {
    const byId = new Map<string, { id: string; name: string }>();
    this.themes().forEach((theme) => {
      theme.variants.forEach((variant) => {
        if (!byId.has(variant.id)) {
          byId.set(variant.id, { id: variant.id, name: variant.name });
        }
      });
    });
    return Array.from(byId.values());
  });
  readonly visibleVariants = computed(() => this.globalVariants().slice(0, this.visibleVariantLimit));
  readonly hiddenVariants = computed(() => this.globalVariants().slice(this.visibleVariantLimit));
  readonly hasHiddenVariants = computed(() => this.globalVariants().length > this.visibleVariantLimit);
  readonly layoutColumnOptions = [
    { id: 'auto', label: 'Auto', value: SettingsPageComponent.AUTO_COLUMNS_VALUE, visualColumns: 3, isAuto: true },
    { id: '2', label: '2', value: 2, visualColumns: 2, isAuto: false },
    { id: '3', label: '3', value: 3, visualColumns: 3, isAuto: false },
    { id: '4', label: '4', value: 4, visualColumns: 4, isAuto: false }
  ] as const;
  readonly runtimeCapabilitiesSummary = computed(() => [
    {
      id: 'runtime',
      label: 'Runtime',
      value: this.launcherCapabilities.runtime,
      state: 'Activo'
    },
    {
      id: 'url',
      label: 'URL',
      value: this.launcherCapabilities.canOpenUrl ? 'Disponible' : 'No disponible',
      state: this.launcherCapabilities.canOpenUrl ? 'OK' : 'Limitado'
    },
    {
      id: 'folder',
      label: 'Carpeta',
      value: this.launcherCapabilities.canOpenFolder ? 'Disponible' : 'No disponible',
      state: this.launcherCapabilities.canOpenFolder ? 'OK' : 'Limitado'
    },
    {
      id: 'resource',
      label: 'Recurso',
      value: this.launcherCapabilities.canOpenResource ? 'Disponible' : 'No disponible',
      state: this.launcherCapabilities.canOpenResource ? 'OK' : 'Limitado'
    },
    {
      id: 'external',
      label: 'App externa',
      value: this.launcherCapabilities.canOpenExternalApp ? 'Disponible' : 'No disponible',
      state: this.launcherCapabilities.canOpenExternalApp ? 'OK' : 'Limitado'
    }
  ]);

  setColumns(columns: number): void {
    this.themeService.setLayoutOptions({ columns });
  }

  setAutoColumns(): void {
    this.themeService.setLayoutOptions({ columns: SettingsPageComponent.AUTO_COLUMNS_VALUE });
  }

  setTheme(themeId: string): void {
    this.themeService.setTheme(themeId);
    this.areExtraVariantsOpen.set(false);
  }

  setThemeVariant(variantId: string, options?: { closeExtraPanel?: boolean }): void {
    this.themeService.setThemeVariant(variantId);
    if (options?.closeExtraPanel) {
      this.areExtraVariantsOpen.set(false);
    }
  }

  toggleExtraVariants(): void {
    if (!this.hasHiddenVariants()) {
      return;
    }

    this.areExtraVariantsOpen.update((isOpen) => !isOpen);
  }

  setCompactMode(compactMode: boolean): void {
    this.themeService.setLayoutOptions({ compactMode });
  }

  setWallpaperBlur(blurPx: number): void {
    this.themeService.setWallpaperBlurPx(blurPx);
  }

  applyCustomWallpaper(rawSource: string): void {
    this.themeService.setCustomWallpaper(rawSource);
    if (rawSource.trim()) {
      this.notificationService.success('Fondo personalizado aplicado.');
    }
  }

  clearCustomWallpaper(): void {
    this.themeService.setCustomWallpaper('');
    this.notificationService.info('Fondo personalizado eliminado.');
  }

  async onCustomWallpaperFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.notificationService.error('Selecciona un archivo de imagen válido.');
      input.value = '';
      return;
    }

    if (file.size > SettingsPageComponent.MAX_CUSTOM_WALLPAPER_BYTES) {
      this.notificationService.error('La imagen supera 8 MB. Usa una mas ligera.');
      input.value = '';
      return;
    }

    try {
      const dataUrl = await this.readFileAsDataUrl(file);
      this.themeService.setCustomWallpaper(dataUrl);
      this.notificationService.success(`Fondo personalizado "${file.name}" aplicado.`);
    } catch {
      this.notificationService.error('No se pudo leer la imagen seleccionada.');
    } finally {
      input.value = '';
    }
  }

  applyPreset(presetId: string): void {
    this.themeService.applyVisualPreset(presetId);
    this.highlightedPresetId.set(presetId);
    window.setTimeout(() => {
      if (this.highlightedPresetId() === presetId) {
        this.highlightedPresetId.set('');
      }
    }, 500);

    if (this.userPresets().some((preset) => preset.id === presetId)) {
      this.selectedUserPresetId.set(presetId);
    }

    const preset = this.presets().find((item) => item.id === presetId);
    if (preset) {
      this.notificationService.info(`Preset "${preset.label}" aplicado.`);
    }
  }

  getPresetPreview(preset: VisualPreset): string {
    return this.wallpaperValueById()[preset.config.wallpaperId] ?? 'none';
  }

  saveCurrentAsPreset(rawName: string): void {
    const result = this.themeService.createCustomPreset(rawName);
    if (!result.success || !result.preset) {
      this.notificationService.error(result.error ?? 'No se pudo guardar el preset.');
      return;
    }

    this.selectedUserPresetId.set(result.preset.id);
    this.notificationService.success(`Preset "${result.preset.label}" guardado.`);
  }

  selectUserPreset(presetId: string): void {
    this.selectedUserPresetId.set(presetId);
  }

  updateSelectedPreset(rawName: string): void {
    const presetId = this.selectedUserPresetId();
    if (!presetId) {
      this.notificationService.error('Selecciona un preset personalizado para actualizarlo.');
      return;
    }

    const normalizedName = rawName.trim();
    const result = this.themeService.updateCustomPreset(presetId, normalizedName ? normalizedName : undefined);
    if (!result.success || !result.preset) {
      this.notificationService.error(result.error ?? 'No se pudo actualizar el preset.');
      return;
    }

    this.notificationService.success(`Preset "${result.preset.label}" actualizado.`);
  }

  requestDeleteSelectedPreset(): void {
    if (!this.selectedUserPresetId()) {
      this.notificationService.error('Selecciona un preset personalizado para eliminarlo.');
      return;
    }

    this.isConfirmDeleteOpen.set(true);
  }

  cancelDeleteSelectedPreset(): void {
    this.isConfirmDeleteOpen.set(false);
  }

  confirmDeleteSelectedPreset(): void {
    const presetId = this.selectedUserPresetId();
    if (!presetId) {
      this.notificationService.error('Selecciona un preset personalizado para eliminarlo.');
      return;
    }

    const result = this.themeService.deleteCustomPreset(presetId);
    if (!result.success) {
      this.notificationService.error(result.error ?? 'No se pudo eliminar el preset.');
      return;
    }

    this.isConfirmDeleteOpen.set(false);
    this.selectedUserPresetId.set('');
    this.notificationService.success('Preset personalizado eliminado.');
  }

  exportConfiguration(): void {
    const exportContent = this.launcherConfigService.exportToJson();
    const blob = new Blob([exportContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    link.href = url;
    link.download = `launcher-config-${timestamp}.json`;
    link.click();
    URL.revokeObjectURL(url);

    this.notificationService.success('Configuración exportada correctamente.');
  }

  downloadImportExample(): void {
    const settings = this.settings();
    const examplePayload = {
      version: 1,
      app: 'dashboar-interactivo',
      exportedAt: new Date().toISOString(),
      data: {
        shortcuts: [],
        categories: [],
        settings: {
          themeId: settings.themeId,
          themeVariantId: settings.themeVariantId,
          wallpaperId: settings.wallpaperId
        },
        visualState: {
          themeId: settings.themeId,
          wallpaperId: settings.wallpaperId,
          presetId: settings.preferences?.activePresetId ?? ''
        },
        customPresets: []
      }
    };

    const content = JSON.stringify(examplePayload, null, 2);
    const blob = new Blob([content], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = 'launcher-config-ejemplo.json';
    link.click();
    URL.revokeObjectURL(url);

    this.notificationService.info('Ejemplo JSON descargado.');
  }

  toggleImportFormatHelp(): void {
    this.isImportFormatHelpOpen.update((value) => !value);
  }

  async importConfigurationFromFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) {
      return;
    }

    this.isImporting.set(true);
    try {
      const content = await file.text();
      const result = this.launcherConfigService.importFromJson(content);
      if (result.success) {
        this.notificationService.success('Configuración importada y aplicada correctamente.');
      } else {
        this.notificationService.error(this.toFriendlyImportError(result.error));
      }
    } catch {
      this.notificationService.error('No se pudo leer el archivo. Verifica que sea un JSON válido exportado desde DashForge.');
    } finally {
      input.value = '';
      this.isImporting.set(false);
    }
  }

  private toFriendlyImportError(rawError: string | undefined): string {
    const error = (rawError ?? '').toLowerCase();
    if (!error) {
      return 'No se pudo importar la configuración. Revisa que el archivo sea un backup válido de DashForge.';
    }

    if (error.includes('json')) {
      return 'El archivo no es un JSON válido. Exporta un backup desde DashForge y vuelve a intentarlo.';
    }

    if (error.includes('compatible') || error.includes('app')) {
      return 'Este archivo no corresponde a un backup compatible de DashForge.';
    }

    if (error.includes('settings') || error.includes('visualstate') || error.includes('custompresets')) {
      return 'El backup está incompleto o dañado en la sección de configuración visual.';
    }

    if (error.includes('shortcuts') || error.includes('categorías')) {
      return 'El backup tiene accesos o categorías inválidas. Usa un archivo exportado desde DashForge.';
    }

    return rawError ?? 'No se pudo importar la configuración. Revisa que el archivo sea un backup válido.';
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result;
        if (typeof result === 'string' && result.trim()) {
          resolve(result);
          return;
        }
        reject(new Error('invalid-result'));
      };
      reader.onerror = () => reject(reader.error ?? new Error('read-failed'));
      reader.readAsDataURL(file);
    });
  }
}

