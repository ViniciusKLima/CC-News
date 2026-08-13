import { Routes } from '@angular/router';

import { Home } from './pages/public/home/home';
import { Archive } from './pages/public/archive/archive';
import { Edition } from './pages/public/edition/edition';

import { Login } from './pages/admin/login/login';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Editor } from './pages/admin/editor/editor';

export const routes: Routes = [
  // Área pública
  {
    path: '',
    component: Home,
  },
  {
    path: 'arquivo',
    component: Archive,
  },
  {
    path: 'edicao/:id',
    component: Edition,
  },

  // Área administrativa
  {
    path: 'admin/login',
    component: Login,
  },
  {
    path: 'admin',
    component: Dashboard,
  },
  {
    path: 'admin/edicao/nova',
    component: Editor,
  },
  {
    path: 'admin/edicao/:id/editar',
    component: Editor,
  },

  // Rota inexistente
  {
    path: '**',
    redirectTo: '',
  },
];
