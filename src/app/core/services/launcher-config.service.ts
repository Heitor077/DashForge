import { Injectable, inject } from '@angular/core';

import { DashboardSettings } from '../models/dashboard-settings.model';
import {
  LauncherConfigExportV1,
  LauncherConfigImportResult
} from '../models/launcher-config.model';
import { VisualPreset } from '../models/visual-preset.model';
import { ShortcutsService } from './shortcuts.service';
import { ThemeService } from './theme.service';

const APP_ID = 'dashboar-interactivo';

@Injectable({ providedIn: 'root' })
export class LauncherConfigService {
  private readonly shortcutsService = inject(ShortcutsService);
  private readonly themeService = inject(ThemeService);

  exportConfiguration(): LauncherConfigExportV1 {
    const shortcutsSnapshot = this.shortcutsService.getSnapshot();
    const themeSnapshot = this.themeService.getSnapshot();

    return {
      version: 1,
      app: APP_ID,
      exportedAt: new Date().toISOString(),
      data: {
        shortcuts: shortcutsSnapshot.shortcuts,
        categories: shortcutsSnapshot.categories,
        settings: themeSnapshot.settings,
        visualState: themeSnapshot.visualState,
        customPresets: themeSnapshot.customPresets
      }
    };
  }

  exportToJson(): string {
    return JSON.stringify(this.exportConfiguration(), null, 2);
  }

  importFromJson(rawJson: string): LauncherConfigImportResult {
    const parsed = this.parseRawJson(rawJson);
    if (!parsed.success || !parsed.payload) {
      return parsed;
    }

    const shortcutValidation = this.shortcutsService.validateImportedData({
      shortcuts: parsed.payload.data.shortcuts,
      categories: parsed.payload.data.categories
    });
    if (!shortcutValidation.success) {
      return {
        success: false,
        error: shortcutValidation.error ?? 'El archivo contiene accesos o categorías inválidos.'
      };
    }

    const visualValidation = this.themeService.validateImportedConfiguration({
      settings: parsed.payload.data.settings,
      visualState: parsed.payload.data.visualState,
      customPresets: parsed.payload.data.customPresets
    });
    if (!visualValidation.success) {
      return {
        success: false,
        error: visualValidation.error ?? 'La configuración visual no es valida.'
      };
    }

    this.shortcutsService.applyImportedData({
      shortcuts: parsed.payload.data.shortcuts,
      categories: parsed.payload.data.categories
    });
    this.themeService.applyImportedConfiguration({
      settings: parsed.payload.data.settings,
      visualState: parsed.payload.data.visualState,
      customPresets: parsed.payload.data.customPresets
    });

    return { success: true };
  }

  private parseRawJson(rawJson: string): { success: boolean; payload?: LauncherConfigExportV1; error?: string } {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      return { success: false, error: 'El archivo no contiene JSON válido.' };
    }

    if (!parsed || typeof parsed !== 'object') {
      return { success: false, error: 'El formato del archivo no es válido.' };
    }

    const source = parsed as Record<string, unknown>;
    const version = source['version'];
    const app = source['app'];
    const data = source['data'];
    if (version !== 1 || app !== APP_ID) {
      return { success: false, error: 'El archivo no corresponde a una exportacion compatible.' };
    }

    if (!data || typeof data !== 'object') {
      return { success: false, error: 'Falta el bloque data en el archivo.' };
    }

    const rawData = data as Record<string, unknown>;
    const shortcuts = rawData['shortcuts'];
    const categories = rawData['categories'];
    const settings = rawData['settings'];
    const visualState = rawData['visualState'];
    const customPresets = rawData['customPresets'];

    if (!Array.isArray(shortcuts) || !Array.isArray(categories)) {
      return { success: false, error: 'El archivo no incluye shortcuts/categorías válidos.' };
    }

    if (!this.isSettingsShape(settings)) {
      return { success: false, error: 'El bloque de settings es inválido.' };
    }

    if (visualState !== undefined && !this.isVisualStateShape(visualState)) {
      return { success: false, error: 'El bloque visualState es inválido.' };
    }

    if (customPresets !== undefined && !Array.isArray(customPresets)) {
      return { success: false, error: 'El bloque customPresets es inválido.' };
    }

    const visualStateSource =
      visualState && typeof visualState === 'object'
        ? (visualState as { themeId?: string; wallpaperId?: string; presetId?: string })
        : {};
    const activePresetFromSettings =
      settings.preferences && typeof settings.preferences.activePresetId === 'string'
        ? settings.preferences.activePresetId
        : '';

    return {
      success: true,
      payload: {
        version: 1,
        app: APP_ID,
        exportedAt: typeof source['exportedAt'] === 'string' ? source['exportedAt'] : new Date().toISOString(),
        data: {
          shortcuts,
          categories,
          settings,
          visualState: {
            themeId: visualStateSource.themeId?.trim() || settings.themeId,
            wallpaperId: visualStateSource.wallpaperId?.trim() || settings.wallpaperId,
            presetId: visualStateSource.presetId?.trim() || activePresetFromSettings
          },
          customPresets: (customPresets ?? []) as VisualPreset[]
        }
      }
    };
  }

  private isSettingsShape(value: unknown): value is DashboardSettings {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const source = value as Record<string, unknown>;
    return (
      typeof source['themeId'] === 'string' &&
      typeof source['themeVariantId'] === 'string' &&
      typeof source['wallpaperId'] === 'string'
    );
  }

  private isVisualStateShape(value: unknown): value is { themeId?: string; wallpaperId?: string; presetId?: string } {
    if (!value || typeof value !== 'object') {
      return false;
    }

    const source = value as Record<string, unknown>;
    const themeId = source['themeId'];
    const wallpaperId = source['wallpaperId'];
    const presetId = source['presetId'];

    const isOptionalString = (item: unknown) => item === undefined || typeof item === 'string';
    return isOptionalString(themeId) && isOptionalString(wallpaperId) && isOptionalString(presetId);
  }
}

