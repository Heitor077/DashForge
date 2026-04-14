import { ProjectItem } from './project.model';

export interface AppState {
  projects: ProjectItem[];
  activeProjectId: string;
}
