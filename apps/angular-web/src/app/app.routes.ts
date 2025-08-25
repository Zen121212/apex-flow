import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/landing/landing.component').then(m => m.LandingComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./components/upload/upload.component').then(m => m.UploadComponent)
  },
  {
    path: 'documents',
    loadComponent: () => import('./components/documents/documents.component').then(m => m.DocumentsComponent)
  },
  {
    path: 'documents/:id',
    loadComponent: () => import('./components/document-detail/document-detail.component').then(m => m.DocumentDetailComponent)
  },
  {
    path: 'workflows',
    loadComponent: () => import('./components/workflows/workflows.component').then(m => m.WorkflowsComponent)
  },
  {
    path: 'workflows/:id',
    loadComponent: () => import('./components/workflow-detail/workflow-detail.component').then(m => m.WorkflowDetailComponent)
  },
  {
    path: 'runs',
    loadComponent: () => import('./components/runs/runs.component').then(m => m.RunsComponent)
  },
  {
    path: 'runs/:id',
    loadComponent: () => import('./components/run-detail/run-detail.component').then(m => m.RunDetailComponent)
  },
  {
    path: 'integrations',
    loadComponent: () => import('./components/integrations/integrations.component').then(m => m.IntegrationsComponent)
  },
  {
    path: 'settings',
    loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
