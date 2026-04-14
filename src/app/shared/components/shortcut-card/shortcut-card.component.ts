import { Component, EventEmitter, HostListener, Input, OnChanges, Output, inject } from '@angular/core';

import { Shortcut } from '../../../core/models/shortcut.model';
import { ResolvedShortcutIcon, ShortcutIconService } from '../../../core/services/shortcut-icon.service';

@Component({
  selector: 'app-shortcut-card',
  standalone: true,
  templateUrl: './shortcut-card.component.html',
  styleUrl: './shortcut-card.component.css'
})
export class ShortcutCardComponent implements OnChanges {
  private readonly shortcutIconService = inject(ShortcutIconService);

  @Input({ required: true }) shortcut!: Shortcut;
  @Input() categoryLabel = '';
  @Input() showLabels = true;
  @Input() searchTerm = '';
  @Input() isKeyboardSelected = false;

  @Output() launch = new EventEmitter<Shortcut>();
  @Output() edit = new EventEmitter<Shortcut>();
  @Output() remove = new EventEmitter<Shortcut>();
  @Output() toggleFavorite = new EventEmitter<Shortcut>();
  iconView: ResolvedShortcutIcon = { mode: 'initial', text: 'SC' };
  isOptionsOpen = false;
  titleHighlight = [{ text: '', match: false }];
  valueHighlight = [{ text: '', match: false }];

  ngOnChanges(): void {
    this.iconView = this.shortcutIconService.resolve(this.shortcut);
    this.titleHighlight = this.buildHighlight(this.shortcut.name, this.searchTerm);
    this.valueHighlight = this.buildHighlight(this.shortcut.value, this.searchTerm);
  }

  onLaunch(): void {
    this.isOptionsOpen = false;
    this.launch.emit(this.shortcut);
  }

  openContextMenu(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isOptionsOpen = true;
  }

  toggleOptions(event: Event): void {
    event.stopPropagation();
    this.isOptionsOpen = !this.isOptionsOpen;
  }

  onQuickEdit(event: Event): void {
    event.stopPropagation();
    this.isOptionsOpen = false;
    this.edit.emit(this.shortcut);
  }

  onEdit(event: Event): void {
    event.stopPropagation();
    this.isOptionsOpen = false;
    this.edit.emit(this.shortcut);
  }

  onRemove(event: Event): void {
    event.stopPropagation();
    this.isOptionsOpen = false;
    this.remove.emit(this.shortcut);
  }

  onToggleFavorite(event: Event): void {
    event.stopPropagation();
    this.isOptionsOpen = false;
    this.toggleFavorite.emit(this.shortcut);
  }

  @HostListener('document:click')
  closeOptions(): void {
    this.isOptionsOpen = false;
  }

  @HostListener('document:keydown.escape')
  closeOptionsByKeyboard(): void {
    this.isOptionsOpen = false;
  }

  private buildHighlight(text: string, rawTerm: string): Array<{ text: string; match: boolean }> {
    const term = rawTerm.trim();
    if (!term) {
      return [{ text, match: false }];
    }

    const source = text.toLowerCase();
    const lookup = term.toLowerCase();
    const matchIndex = source.indexOf(lookup);
    if (matchIndex < 0) {
      return [{ text, match: false }];
    }

    return [
      { text: text.slice(0, matchIndex), match: false },
      { text: text.slice(matchIndex, matchIndex + term.length), match: true },
      { text: text.slice(matchIndex + term.length), match: false }
    ].filter((part) => part.text.length > 0);
  }
}
