import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'teams',
    loadComponent: () =>
      import('./pages/team-select/team-select.component').then((m) => m.TeamSelectComponent),
  },
  {
    path: 'lineup',
    loadComponent: () =>
      import('./pages/lineup/lineup.component').then((m) => m.LineupComponent),
  },
  {
    path: 'dream-xi',
    loadComponent: () =>
      import('./pages/dream-xi/dream-xi.component').then((m) => m.DreamXiComponent),
  },
  {
    path: 'simulation',
    loadComponent: () =>
      import('./pages/simulation/simulation.component').then((m) => m.SimulationComponent),
  },
  {
    path: 'history',
    loadComponent: () =>
      import('./pages/history/history.component').then((m) => m.HistoryComponent),
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.component').then((m) => m.AuthComponent),
  },
  { path: '**', redirectTo: '' },
];
