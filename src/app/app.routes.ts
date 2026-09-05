import { Routes } from '@angular/router';

import { Home } from './pages/public/home/home';
import { Archive } from './pages/public/archive/archive';
import { Edition } from './pages/public/edition/edition';

import { Login } from './pages/admin/login/login';
import { Dashboard } from './pages/admin/dashboard/dashboard';
import { Editor } from './pages/admin/editor/editor';
import { UsuariosInternos } from './pages/admin/usuarios/usuarios';
import { Aparencia } from './pages/admin/aparencia/aparencia';
import { authGuard } from './core/guards/auth.guard';
import { adminRoleGuard } from './core/guards/admin-role.guard';

// Rotas da aplicação. As rotas administrativas usam authGuard para exigir
// login e adminRoleGuard para restringir o acesso a usuários com papel admin.
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
    canActivate: [authGuard],
  },
  {
    path: 'admin/usuarios',
    component: UsuariosInternos,
    canActivate: [authGuard, adminRoleGuard],
  },
  {
    path: 'admin/aparencia',
    component: Aparencia,
    canActivate: [authGuard, adminRoleGuard],
  },
  {
    path: 'admin/edicao/nova',
    component: Editor,
    canActivate: [authGuard],
  },
  {
    path: 'admin/edicao/:id/editar',
    component: Editor,
    canActivate: [authGuard],
  },
  // Pré-visualização de uma edição ainda não publicada, aberta pelo Editor
  // numa aba separada. Reaproveita o mesmo componente da edição pública
  // (ver Edition, propriedade `preview`), mas os dados vêm da sessionStorage
  // (ver PreviewService) em vez do Firestore.
  {
    path: 'admin/preview/:id',
    component: Edition,
    canActivate: [authGuard],
    data: { preview: true },
  },

  // Rota inexistente
  {
    path: '**',
    redirectTo: '',
  },
];
