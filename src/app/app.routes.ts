import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/dashboard/pages/dashboard-page/dashboard-page.component').then(
        (module) => module.DashboardPageComponent
      )
  },
  {
    path: 'settings',
    loadComponent: () =>
      import('./features/settings/pages/settings-page/settings-page.component').then(
        (module) => module.SettingsPageComponent
      )
  },
  {
    path: '**',
    redirectTo: ''
  }
];
