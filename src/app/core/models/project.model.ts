import { ShortcutItem } from './shortcut.model';

export interface ProjectItem {
  id: string;
  name: string;
  shortcuts: ShortcutItem[];
}
