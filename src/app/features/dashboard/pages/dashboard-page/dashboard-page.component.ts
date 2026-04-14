import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, HostListener, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { Shortcut, ShortcutOperationResult, ShortcutType } from '../../../../core/models/shortcut.model';
import { ShortcutsService } from '../../../../core/services/shortcuts.service';
import { ThemeService } from '../../../../core/services/theme.service';
import { ShortcutCardComponent } from '../../../../shared/components/shortcut-card/shortcut-card.component';

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [DragDropModule, ReactiveFormsModule, RouterLink, ShortcutCardComponent],
  templateUrl: './dashboard-page.component.html',
  styleUrl: './dashboard-page.component.css'
})
export class DashboardPageComponent {
  private static readonly ALL_CATEGORY_ID = 'all';
  @ViewChild('launcherSearchInput') launcherSearchInput?: ElementRef<HTMLInputElement>;

  private readonly formBuilder = inject(FormBuilder);
  private readonly shortcutsService = inject(ShortcutsService);
  private readonly document = inject(DOCUMENT);
  readonly themeService = inject(ThemeService);

  readonly shortcuts = this.shortcutsService.shortcuts;
  readonly projects = this.shortcutsService.projects;
  readonly activeProject = this.shortcutsService.activeProject;
  readonly activeProjectId = this.shortcutsService.activeProjectId;
  readonly categories = this.shortcutsService.categories;
  readonly settings = this.themeService.settings;
  readonly shortcutTypes: ShortcutType[] = ['url', 'folder', 'resource'];
  readonly selectedCategoryId = signal<string>(DashboardPageComponent.ALL_CATEGORY_ID);
  readonly showShortcutLabels = computed(() => this.settings().preferences?.showShortcutLabels ?? true);
  readonly dashboardColumns = computed(() => this.settings().layoutOptions?.columns ?? 3);
  readonly dashboardColumnsTemplate = computed(() => {
    const columns = this.dashboardColumns();
    if (columns <= 0) {
      return 'repeat(auto-fit, minmax(250px, 1fr))';
    }

    return `repeat(${columns}, minmax(250px, 1fr))`;
  });
  readonly compactMode = computed(() => this.settings().layoutOptions?.compactMode ?? false);

  readonly isShortcutModalOpen = signal(false);
  readonly isEditMode = signal(false);
  readonly isFocusMode = signal(false);
  readonly isFullscreen = signal(false);
  readonly searchQuery = signal('');
  readonly selectedShortcutId = signal('');
  readonly formError = signal('');
  readonly projectEditorMode = signal<'idle' | 'create' | 'rename'>('idle');
  readonly projectNameInput = signal('');
  readonly projectNameError = signal('');
  readonly isDeleteProjectConfirmOpen = signal(false);
  readonly isProjectDropdownOpen = signal(false);
  readonly shortcutToCopy = signal<Shortcut | null>(null);
  readonly copyTargetProjectId = signal('');
  readonly copyShortcutError = signal('');
  readonly isMultiSelectMode = signal(false);
  readonly selectedShortcutIds = signal<string[]>([]);
  readonly isBulkCopyPanelOpen = signal(false);
  readonly bulkCopyTargetProjectId = signal('');
  readonly bulkCopyError = signal('');
  readonly isBulkCopyDropdownOpen = signal(false);
  readonly isProjectLaunchDropdownOpen = signal(false);
  readonly isProjectLaunchConfigMode = signal(false);
  readonly projectLaunchDraftSelectedIds = signal<string[]>([]);
  readonly projectLaunchConfigError = signal('');
  readonly isProjectLaunchRunning = signal(false);
  readonly actionFeedback = signal<{ type: 'idle' | 'success' | 'error'; message: string }>({
    type: 'idle',
    message: ''
  });
  private editingShortcutId: string | null = null;
  private feedbackTimeoutId: number | null = null;
  private readonly shortcutTypeValueValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
    const typeValue = String(control.get('type')?.value ?? '').trim();
    const targetValue = String(control.get('value')?.value ?? '').trim();
    if (!this.isShortcutType(typeValue) || !targetValue) {
      return null;
    }

    const typeAwareError = this.getTypeAwareValueError(typeValue, targetValue);
    if (!typeAwareError) {
      return null;
    }

    return { invalidTargetForType: typeAwareError };
  };

  readonly shortcutForm = this.formBuilder.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(80)]],
    type: ['url' as ShortcutType, Validators.required],
    value: ['', [Validators.required, Validators.maxLength(300)]],
    icon: ['', [Validators.maxLength(12)]],
    color: ['', [Validators.maxLength(24)]],
    categoryId: ['']
  }, {
    validators: [this.shortcutTypeValueValidator]
  });
  readonly valueFieldMeta = computed(() => {
    const type = this.shortcutForm.controls.type.value;
    if (type === 'folder') {
      return {
        placeholder: 'Ej: C:\\\\Users\\\\TuUsuario\\\\Downloads',
        hint: 'Tipo folder: usa una carpeta local absoluta.'
      };
    }

    if (type === 'resource') {
      return {
        placeholder: 'Ej: C:\\\\Users\\\\TuUsuario\\\\Documentos\\\\manual.pdf',
        hint: 'Tipo resource: usa un archivo local (pdf, txt, exe, lnk, etc.).'
      };
    }

    return {
      placeholder: 'Ej: https://angular.dev o mailto:equipo@empresa.com',
      hint: 'Tipo url: solo http, https o mailto.'
    };
  });

  readonly categoryLabels = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    this.shortcutsService.categories().forEach((category) => {
      map[category.id] = category.name;
    });
    return map;
  });
  readonly filteredShortcuts = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const categoryId = this.selectedCategoryId();

    return this.shortcuts().filter((shortcut) => {
      const categoryLabel = this.categoryLabels()[shortcut.categoryId ?? ''] ?? 'general';
      const matchesCategory =
        categoryId === DashboardPageComponent.ALL_CATEGORY_ID || shortcut.categoryId === categoryId;

      if (!matchesCategory) {
        return false;
      }

      if (!query) {
        return true;
      }

      const searchable = `${shortcut.name} ${shortcut.type} ${categoryLabel} ${shortcut.value}`.toLowerCase();
      return searchable.includes(query);
    });
  });
  readonly favoriteShortcuts = computed(() => this.filteredShortcuts().filter((shortcut) => shortcut.isFavorite));
  readonly regularShortcuts = computed(() => this.filteredShortcuts().filter((shortcut) => !shortcut.isFavorite));
  readonly orderedVisibleShortcuts = computed(() => [...this.favoriteShortcuts(), ...this.regularShortcuts()]);
  readonly canDeleteProject = computed(() => this.projects().length > 1);
  readonly canCopyShortcutToAnotherProject = computed(() => this.projects().length > 1);
  readonly selectedShortcutsCount = computed(() => this.selectedShortcutIds().length);
  readonly canOpenBulkCopyAction = computed(() => this.isMultiSelectMode() && this.selectedShortcutsCount() > 0);
  readonly projectLaunchSelectedCount = computed(() => this.projectLaunchDraftSelectedIds().length);
  readonly copyDestinationProjects = computed(() =>
    this.projects().filter((project) => project.id !== this.activeProjectId())
  );
  readonly categoryFilters = computed(() => [
    { id: DashboardPageComponent.ALL_CATEGORY_ID, name: 'Todos' },
    ...this.categories()
  ]);

  constructor() {
    effect(
      () => {
        const visibleShortcuts = this.orderedVisibleShortcuts();
        const selectedShortcutId = this.selectedShortcutId();
        if (visibleShortcuts.length === 0) {
          if (selectedShortcutId) {
            this.selectedShortcutId.set('');
          }
          return;
        }

        if (!selectedShortcutId || !visibleShortcuts.some((shortcut) => shortcut.id === selectedShortcutId)) {
          this.selectedShortcutId.set(visibleShortcuts[0].id);
        }
      },
      { allowSignalWrites: true }
    );
  }

  launchShortcut(shortcut: Shortcut): void {
    void this.shortcutsService.openShortcut(shortcut).then((result) => {
      if (result.success) {
        return;
      }

      this.setActionFeedback('error', result.message ?? 'No se pudo abrir el acceso seleccionado.');
    });
  }

  openCreateShortcutModal(): void {
    this.isEditMode.set(false);
    this.editingShortcutId = null;
    this.formError.set('');
    this.shortcutForm.reset({
      name: '',
      type: 'url',
      value: '',
      icon: '',
      color: '',
      categoryId: this.selectedCategoryId() === DashboardPageComponent.ALL_CATEGORY_ID ? '' : this.selectedCategoryId()
    });
    this.isShortcutModalOpen.set(true);
  }

  openEditShortcutModal(shortcut: Shortcut): void {
    this.isEditMode.set(true);
    this.editingShortcutId = shortcut.id;
    this.formError.set('');
    this.shortcutForm.reset({
      name: shortcut.name,
      type: shortcut.type,
      value: shortcut.value,
      icon: shortcut.icon ?? '',
      color: shortcut.color ?? '',
      categoryId: shortcut.categoryId ?? ''
    });
    this.isShortcutModalOpen.set(true);
  }

  closeShortcutModal(): void {
    this.isShortcutModalOpen.set(false);
    this.formError.set('');
  }

  saveShortcut(): void {
    if (this.shortcutForm.invalid) {
      this.shortcutForm.markAllAsTouched();
      this.formError.set(this.resolveFormErrorMessage());
      return;
    }

    const formValue = this.shortcutForm.getRawValue();
    const payload = {
      id: this.isEditMode() ? this.editingShortcutId ?? undefined : undefined,
      name: formValue.name,
      type: formValue.type,
      value: formValue.value,
      icon: formValue.icon,
      color: formValue.color,
      categoryId: formValue.categoryId
    };

    const result = this.isEditMode()
      ? this.shortcutsService.updateShortcut(payload)
      : this.shortcutsService.createShortcut(payload);

    this.handleOperationResult(result, this.isEditMode() ? 'Acceso actualizado.' : 'Acceso creado.');
    if (result.success) {
      this.closeShortcutModal();
    }
  }

  deleteShortcut(shortcut: Shortcut): void {
    const result = this.shortcutsService.deleteShortcut(shortcut.id);
    this.handleOperationResult(result, 'Acceso eliminado.');
  }

  toggleFavorite(shortcut: Shortcut): void {
    const result = this.shortcutsService.toggleFavorite(shortcut.id);
    this.handleOperationResult(result, shortcut.isFavorite ? 'Se quito de favoritos.' : 'Marcado como favorito.');
  }

  onShortcutDrop(event: CdkDragDrop<Shortcut[]>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const visibleShortcuts = [...this.regularShortcuts()];
    moveItemInArray(visibleShortcuts, event.previousIndex, event.currentIndex);

    const visibleIds = new Set(visibleShortcuts.map((shortcut) => shortcut.id));
    const fullShortcuts = this.shortcuts();
    let visibleCursor = 0;
    const reordered = fullShortcuts.map((shortcut) => {
      if (!visibleIds.has(shortcut.id)) {
        return shortcut;
      }

      const replacement = visibleShortcuts[visibleCursor];
      visibleCursor += 1;
      return replacement;
    });

    const result = this.shortcutsService.setShortcutsOrder(reordered);
    this.handleOperationResult(result, 'Orden actualizado.');
  }

  selectCategoryFilter(categoryId: string): void {
    this.selectedCategoryId.set(categoryId);
  }

  setSearchQuery(rawValue: string): void {
    this.searchQuery.set(rawValue);
  }

  setActiveProject(projectId: string): void {
    this.shortcutsService.setActiveProject(projectId);
    this.closeProjectDropdown();
    this.closeProjectLaunchDropdown();
    this.cancelCopyShortcutPanel();
    this.resetBulkCopyState();
    this.clearSelectedShortcuts();
    this.cancelProjectLaunchConfigMode();
  }

  toggleProjectDropdown(): void {
    if (!this.isProjectDropdownOpen()) {
      this.closeBulkCopyDropdown();
    }
    this.isProjectDropdownOpen.update((value) => !value);
  }

  closeProjectDropdown(): void {
    this.isProjectDropdownOpen.set(false);
  }

  selectProjectFromDropdown(projectId: string): void {
    this.setActiveProject(projectId);
  }

  createProject(): void {
    this.closeProjectDropdown();
    this.closeProjectLaunchDropdown();
    this.cancelProjectLaunchConfigMode();
    this.cancelCopyShortcutPanel();
    this.projectEditorMode.set('create');
    this.projectNameInput.set('');
    this.projectNameError.set('');
    this.isDeleteProjectConfirmOpen.set(false);
  }

  renameActiveProject(): void {
    this.closeProjectDropdown();
    this.closeProjectLaunchDropdown();
    this.cancelProjectLaunchConfigMode();
    this.cancelCopyShortcutPanel();
    this.projectEditorMode.set('rename');
    this.projectNameInput.set(this.activeProject().name);
    this.projectNameError.set('');
    this.isDeleteProjectConfirmOpen.set(false);
  }

  deleteActiveProject(): void {
    this.closeProjectDropdown();
    this.closeProjectLaunchDropdown();
    this.cancelProjectLaunchConfigMode();
    this.cancelCopyShortcutPanel();
    const projects = this.projects();
    if (projects.length <= 1) {
      this.setActionFeedback('error', 'Debe existir al menos un proyecto.');
      return;
    }

    this.projectEditorMode.set('idle');
    this.projectNameError.set('');
    this.isDeleteProjectConfirmOpen.set(true);
  }

  cancelProjectEditor(): void {
    this.projectEditorMode.set('idle');
    this.projectNameInput.set('');
    this.projectNameError.set('');
  }

  setProjectNameInput(value: string): void {
    this.projectNameInput.set(value);
    if (value.trim()) {
      this.projectNameError.set('');
    }
  }

  saveProjectEditor(event: Event): void {
    event.preventDefault();

    const normalizedName = this.projectNameInput().trim();
    if (!normalizedName) {
      this.projectNameError.set('El nombre del proyecto es obligatorio.');
      this.setActionFeedback('error', 'El nombre del proyecto es obligatorio.');
      return;
    }

    const mode = this.projectEditorMode();
    const result =
      mode === 'rename'
        ? this.shortcutsService.renameProject(this.activeProject().id, normalizedName)
        : this.shortcutsService.createProject(normalizedName);

    this.handleOperationResult(result, mode === 'rename' ? 'Proyecto renombrado.' : 'Proyecto creado y seleccionado.');
    if (result.success) {
      if (mode === 'create') {
        this.clearSelectedShortcuts();
        this.resetBulkCopyState();
        this.cancelCopyShortcutPanel();
      }
      this.cancelProjectEditor();
    }
  }

  cancelDeleteProject(): void {
    this.isDeleteProjectConfirmOpen.set(false);
  }

  confirmDeleteActiveProject(): void {
    if (this.projects().length <= 1) {
      this.setActionFeedback('error', 'Debe existir al menos un proyecto.');
      this.isDeleteProjectConfirmOpen.set(false);
      return;
    }

    const result = this.shortcutsService.deleteProject(this.activeProject().id);
    this.handleOperationResult(result, 'Proyecto eliminado.');
    if (result.success) {
      this.isDeleteProjectConfirmOpen.set(false);
      this.clearSelectedShortcuts();
      this.resetBulkCopyState();
      this.cancelCopyShortcutPanel();
      this.cancelProjectLaunchConfigMode();
    }
  }

  openCopyShortcutPanel(shortcut: Shortcut): void {
    if (!this.canCopyShortcutToAnotherProject()) {
      this.setActionFeedback('error', 'No hay proyectos de destino disponibles.');
      return;
    }

    const destinationProjects = this.copyDestinationProjects();
    if (destinationProjects.length === 0) {
      this.setActionFeedback('error', 'No hay proyectos de destino disponibles.');
      return;
    }

    this.closeProjectDropdown();
    this.closeProjectLaunchDropdown();
    this.cancelBulkCopyPanel();
    this.projectEditorMode.set('idle');
    this.isDeleteProjectConfirmOpen.set(false);
    this.shortcutToCopy.set(shortcut);
    this.copyTargetProjectId.set(destinationProjects[0].id);
    this.copyShortcutError.set('');
  }

  setCopyTargetProjectId(projectId: string): void {
    this.copyTargetProjectId.set(projectId);
    if (projectId.trim()) {
      this.copyShortcutError.set('');
    }
  }

  cancelCopyShortcutPanel(): void {
    this.shortcutToCopy.set(null);
    this.copyTargetProjectId.set('');
    this.copyShortcutError.set('');
  }

  toggleMultiSelectMode(): void {
    const nextState = !this.isMultiSelectMode();
    this.isMultiSelectMode.set(nextState);
    if (nextState && this.isProjectLaunchConfigMode()) {
      this.cancelProjectLaunchConfigMode();
    }
    this.closeProjectLaunchDropdown();
    this.cancelCopyShortcutPanel();
    if (!nextState) {
      this.resetBulkCopyState();
      this.clearSelectedShortcuts();
    }
  }

  toggleShortcutSelection(shortcut: Shortcut): void {
    if (this.isProjectLaunchConfigMode()) {
      this.projectLaunchDraftSelectedIds.update((current) => {
        const exists = current.includes(shortcut.id);
        if (exists) {
          return current.filter((id) => id !== shortcut.id);
        }

        return [...current, shortcut.id];
      });
      return;
    }

    if (!this.isMultiSelectMode()) {
      return;
    }

    this.selectedShortcutIds.update((current) => {
      const exists = current.includes(shortcut.id);
      if (exists) {
        return current.filter((id) => id !== shortcut.id);
      }

      return [...current, shortcut.id];
    });
  }

  isShortcutSelected(shortcutId: string): boolean {
    if (this.isProjectLaunchConfigMode()) {
      return this.projectLaunchDraftSelectedIds().includes(shortcutId);
    }

    return this.selectedShortcutIds().includes(shortcutId);
  }

  toggleProjectLaunchDropdown(): void {
    if (!this.isProjectLaunchDropdownOpen()) {
      this.closeProjectDropdown();
      this.closeBulkCopyDropdown();
    }
    this.isProjectLaunchDropdownOpen.update((value) => !value);
  }

  closeProjectLaunchDropdown(): void {
    this.isProjectLaunchDropdownOpen.set(false);
  }

  async openProjectComplete(): Promise<void> {
    this.closeProjectLaunchDropdown();

    if (this.isProjectLaunchRunning()) {
      return;
    }

    const shortcutsToLaunch = this.shortcuts().filter((shortcut) => shortcut.includeInProjectLaunch);
    if (shortcutsToLaunch.length === 0) {
      this.setActionFeedback('error', 'No hay accesos marcados para abrir en este proyecto.');
      return;
    }

    this.isProjectLaunchRunning.set(true);
    let openedCount = 0;

    try {
      for (const shortcut of shortcutsToLaunch) {
        const result = await this.shortcutsService.openShortcut(shortcut);
        if (result.success) {
          openedCount += 1;
        }
      }
    } finally {
      this.isProjectLaunchRunning.set(false);
    }

    if (openedCount === shortcutsToLaunch.length) {
      this.setActionFeedback('success', `Proyecto abierto (${openedCount} accesos).`);
      return;
    }

    const failedCount = shortcutsToLaunch.length - openedCount;
    this.setActionFeedback(
      'error',
      `Se abrieron ${openedCount} accesos y fallaron ${failedCount}. Revisa las rutas configuradas.`
    );
  }

  enterProjectLaunchConfigMode(): void {
    this.closeProjectLaunchDropdown();
    this.closeProjectDropdown();
    this.cancelCopyShortcutPanel();
    this.cancelBulkCopyPanel();

    if (this.isMultiSelectMode()) {
      this.isMultiSelectMode.set(false);
      this.clearSelectedShortcuts();
      this.resetBulkCopyState();
    }

    const initiallySelected = this.shortcuts()
      .filter((shortcut) => shortcut.includeInProjectLaunch)
      .map((shortcut) => shortcut.id);

    this.projectLaunchDraftSelectedIds.set(initiallySelected);
    this.projectLaunchConfigError.set('');
    this.isProjectLaunchConfigMode.set(true);
  }

  cancelProjectLaunchConfigMode(): void {
    this.isProjectLaunchConfigMode.set(false);
    this.projectLaunchDraftSelectedIds.set([]);
    this.projectLaunchConfigError.set('');
    this.closeProjectLaunchDropdown();
  }

  saveProjectLaunchConfig(): void {
    if (!this.isProjectLaunchConfigMode()) {
      return;
    }

    const result = this.shortcutsService.updateActiveProjectLaunchSelection(this.projectLaunchDraftSelectedIds());
    this.handleOperationResult(result, 'Configuración de apertura de proyecto guardada.');
    if (result.success) {
      this.cancelProjectLaunchConfigMode();
    } else {
      this.projectLaunchConfigError.set(result.error ?? 'No se pudo guardar la configuración.');
    }
  }

  async openSelectedProjectLaunchDraft(): Promise<void> {
    if (!this.isProjectLaunchConfigMode()) {
      return;
    }

    if (this.isProjectLaunchRunning()) {
      return;
    }

    const selectedIds = new Set(this.projectLaunchDraftSelectedIds());
    const shortcutsToLaunch = this.orderedVisibleShortcuts().filter((shortcut) => selectedIds.has(shortcut.id));

    if (shortcutsToLaunch.length === 0) {
      this.projectLaunchConfigError.set('Selecciona al menos un acceso para abrir.');
      this.setActionFeedback('error', 'Selecciona al menos un acceso para abrir.');
      return;
    }

    this.projectLaunchConfigError.set('');
    this.isProjectLaunchRunning.set(true);
    let openedCount = 0;

    try {
      for (const shortcut of shortcutsToLaunch) {
        const result = await this.shortcutsService.openShortcut(shortcut);
        if (result.success) {
          openedCount += 1;
        }
      }
    } finally {
      this.isProjectLaunchRunning.set(false);
      this.cancelProjectLaunchConfigMode();
    }

    if (openedCount === shortcutsToLaunch.length) {
      this.setActionFeedback('success', `Se abrieron ${openedCount} accesos seleccionados.`);
      return;
    }

    const failedCount = shortcutsToLaunch.length - openedCount;
    this.setActionFeedback(
      'error',
      `Se abrieron ${openedCount} accesos y fallaron ${failedCount}. Revisa las rutas configuradas.`
    );
  }

  openBulkCopyPanel(): void {
    if (!this.canOpenBulkCopyAction()) {
      this.setActionFeedback('error', 'Selecciona al menos un acceso para copiar.');
      return;
    }

    const destinations = this.copyDestinationProjects();
    if (destinations.length === 0) {
      this.setActionFeedback('error', 'No hay proyectos de destino disponibles.');
      return;
    }

    this.cancelCopyShortcutPanel();
    this.bulkCopyTargetProjectId.set(destinations[0].id);
    this.bulkCopyError.set('');
    this.isBulkCopyDropdownOpen.set(false);
    this.isBulkCopyPanelOpen.set(true);
  }

  setBulkCopyTargetProjectId(projectId: string): void {
    this.bulkCopyTargetProjectId.set(projectId);
    if (projectId.trim()) {
      this.bulkCopyError.set('');
    }
  }

  toggleBulkCopyDropdown(): void {
    if (!this.isBulkCopyPanelOpen()) {
      return;
    }

    if (!this.isBulkCopyDropdownOpen()) {
      this.closeProjectDropdown();
    }
    this.isBulkCopyDropdownOpen.update((value) => !value);
  }

  closeBulkCopyDropdown(): void {
    this.isBulkCopyDropdownOpen.set(false);
  }

  selectBulkCopyDestination(projectId: string): void {
    this.setBulkCopyTargetProjectId(projectId);
    this.closeBulkCopyDropdown();
  }

  cancelBulkCopyPanel(): void {
    this.isBulkCopyPanelOpen.set(false);
    this.bulkCopyTargetProjectId.set('');
    this.bulkCopyError.set('');
    this.isBulkCopyDropdownOpen.set(false);
  }

  confirmBulkCopy(): void {
    if (!this.canOpenBulkCopyAction()) {
      this.bulkCopyError.set('Selecciona al menos un acceso para copiar.');
      this.setActionFeedback('error', 'Selecciona al menos un acceso para copiar.');
      return;
    }

    const destinationProjectId = this.bulkCopyTargetProjectId().trim();
    if (!destinationProjectId) {
      this.bulkCopyError.set('Selecciona un proyecto de destino.');
      this.setActionFeedback('error', 'Selecciona un proyecto de destino.');
      return;
    }

    const result = this.shortcutsService.copyShortcutsToProject(this.selectedShortcutIds(), destinationProjectId);
    this.handleOperationResult(result, 'Accesos copiados a otro proyecto.');
    if (result.success) {
      this.clearSelectedShortcuts();
      this.cancelBulkCopyPanel();
    }
  }

  confirmCopyShortcut(): void {
    const shortcut = this.shortcutToCopy();
    if (!shortcut) {
      this.copyShortcutError.set('Selecciona un acceso para copiar.');
      this.setActionFeedback('error', 'Selecciona un acceso para copiar.');
      return;
    }

    const destinationProjectId = this.copyTargetProjectId().trim();
    if (!destinationProjectId) {
      this.copyShortcutError.set('Selecciona un proyecto de destino.');
      this.setActionFeedback('error', 'Selecciona un proyecto de destino.');
      return;
    }

    const result = this.shortcutsService.copyShortcutToProject(shortcut.id, destinationProjectId);
    this.handleOperationResult(result, 'Acceso copiado a otro proyecto.');
    if (result.success) {
      this.cancelCopyShortcutPanel();
    }
  }

  toggleFocusMode(): void {
    this.isFocusMode.update((value) => !value);
  }

  toggleFullscreenMode(): void {
    if (!this.document.fullscreenElement) {
      this.document.documentElement
        .requestFullscreen()
        .then(() => this.isFullscreen.set(true))
        .catch(() => this.isFullscreen.set(false));
      return;
    }

    this.document
      .exitFullscreen()
      .then(() => this.isFullscreen.set(false))
      .catch(() => this.isFullscreen.set(false));
  }

  @HostListener('document:fullscreenchange')
  syncFullscreenState(): void {
    this.isFullscreen.set(Boolean(this.document.fullscreenElement));
  }

  @HostListener('document:keydown', ['$event'])
  onGlobalKeydown(event: KeyboardEvent): void {
    if (this.isShortcutModalOpen()) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.closeShortcutModal();
      }
      return;
    }

    if (event.key === 'Escape' && this.isProjectDropdownOpen()) {
      event.preventDefault();
      this.closeProjectDropdown();
      return;
    }

    if (event.key === 'Escape' && this.isProjectLaunchDropdownOpen()) {
      event.preventDefault();
      this.closeProjectLaunchDropdown();
      return;
    }

    if (event.key === 'Escape' && this.isBulkCopyDropdownOpen()) {
      event.preventDefault();
      this.closeBulkCopyDropdown();
      return;
    }

    if (event.key === 'Escape' && this.isBulkCopyPanelOpen()) {
      event.preventDefault();
      this.cancelBulkCopyPanel();
      return;
    }

    if (event.key === 'Escape' && this.isProjectLaunchConfigMode()) {
      event.preventDefault();
      this.cancelProjectLaunchConfigMode();
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.focusSearchInput();
      return;
    }

    if (!this.isEditableTarget(event.target)) {
      if (event.key === '/') {
        event.preventDefault();
        this.focusSearchInput();
        return;
      }
    }

    if (!this.isSearchFocused()) {
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      this.launcherSearchInput?.nativeElement.blur();
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectRelativeResult(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectRelativeResult(-1);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      this.openSelectedOrFirstResult();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target;
    if (!(target instanceof Element)) {
      if (this.isProjectDropdownOpen()) {
        this.closeProjectDropdown();
      }
      if (this.isProjectLaunchDropdownOpen()) {
        this.closeProjectLaunchDropdown();
      }
      if (this.isBulkCopyDropdownOpen()) {
        this.closeBulkCopyDropdown();
      }
      return;
    }

    if (this.isProjectDropdownOpen() && !target.closest('[data-project-dropdown]')) {
      this.closeProjectDropdown();
    }

    if (this.isProjectLaunchDropdownOpen() && !target.closest('[data-project-launch-dropdown]')) {
      this.closeProjectLaunchDropdown();
    }

    if (this.isBulkCopyDropdownOpen() && !target.closest('[data-bulk-copy-dropdown]')) {
      this.closeBulkCopyDropdown();
    }
  }

  getBulkCopyDestinationName(): string {
    const selectedId = this.bulkCopyTargetProjectId().trim();
    if (!selectedId) {
      return 'Seleccionar proyecto';
    }

    const selected = this.copyDestinationProjects().find((project) => project.id === selectedId);
    return selected?.name ?? 'Seleccionar proyecto';
  }

  private handleOperationResult(result: ShortcutOperationResult, successMessage?: string): void {
    this.formError.set(result.success ? '' : result.error ?? 'No se pudo completar la operación.');
    this.setActionFeedback(
      result.success ? 'success' : 'error',
      result.success ? successMessage ?? 'Operación completada.' : result.error ?? 'No se pudo completar la operación.'
    );
  }

  trackById(index: number, item: { id: string }): string {
    return item.id;
  }

  private focusSearchInput(): void {
    const searchInput = this.launcherSearchInput?.nativeElement;
    if (!searchInput) {
      return;
    }

    searchInput.focus();
    searchInput.select();
  }

  private isEditableTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) {
      return false;
    }

    const tagName = target.tagName.toLowerCase();
    return (
      target.isContentEditable ||
      tagName === 'input' ||
      tagName === 'textarea' ||
      tagName === 'select' ||
      !!target.closest('input, textarea, select, [contenteditable="true"]')
    );
  }

  private isSearchFocused(): boolean {
    return this.document.activeElement === this.launcherSearchInput?.nativeElement;
  }

  private selectRelativeResult(step: number): void {
    const visibleShortcuts = this.orderedVisibleShortcuts();
    if (visibleShortcuts.length === 0) {
      this.selectedShortcutId.set('');
      return;
    }

    const currentIndex = visibleShortcuts.findIndex((shortcut) => shortcut.id === this.selectedShortcutId());
    const baseIndex = currentIndex < 0 ? 0 : currentIndex;
    const nextIndex = (baseIndex + step + visibleShortcuts.length) % visibleShortcuts.length;
    this.selectedShortcutId.set(visibleShortcuts[nextIndex].id);
  }

  private openSelectedOrFirstResult(): void {
    const visibleShortcuts = this.orderedVisibleShortcuts();
    if (visibleShortcuts.length === 0) {
      return;
    }

    const selectedShortcut =
      visibleShortcuts.find((shortcut) => shortcut.id === this.selectedShortcutId()) ?? visibleShortcuts[0];
    this.selectedShortcutId.set(selectedShortcut.id);

    if (this.isMultiSelectMode()) {
      this.toggleShortcutSelection(selectedShortcut);
      return;
    }

    if (this.isProjectLaunchConfigMode()) {
      this.toggleShortcutSelection(selectedShortcut);
      return;
    }

    this.launchShortcut(selectedShortcut);
  }

  private clearSelectedShortcuts(): void {
    this.selectedShortcutIds.set([]);
  }

  private resetBulkCopyState(): void {
    this.cancelBulkCopyPanel();
    this.bulkCopyError.set('');
    this.bulkCopyTargetProjectId.set('');
  }

  private setActionFeedback(type: 'success' | 'error', message: string): void {
    if (this.feedbackTimeoutId !== null) {
      window.clearTimeout(this.feedbackTimeoutId);
      this.feedbackTimeoutId = null;
    }

    this.actionFeedback.set({ type, message });
    this.feedbackTimeoutId = window.setTimeout(() => {
      this.actionFeedback.set({ type: 'idle', message: '' });
      this.feedbackTimeoutId = null;
    }, 2400);
  }

  private resolveFormErrorMessage(): string {
    const typeAwareError = this.shortcutForm.getError('invalidTargetForType');
    if (typeof typeAwareError === 'string' && typeAwareError.trim()) {
      return typeAwareError;
    }

    if (this.shortcutForm.controls.name.hasError('required')) {
      return 'El nombre es obligatorio.';
    }

    if (this.shortcutForm.controls.value.hasError('required')) {
      return 'El valor es obligatorio.';
    }

    return 'Revisa los campos del formulario.';
  }

  private isShortcutType(value: string): value is ShortcutType {
    return value === 'url' || value === 'folder' || value === 'resource';
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
}

