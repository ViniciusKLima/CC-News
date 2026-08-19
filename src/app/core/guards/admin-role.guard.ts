import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';
import { ToastService } from '../services/toast.service';

export const adminRoleGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const usuarioAutenticado = await firstValueFrom(user(auth));
  const usuario = usuarioAutenticado?.email ? await usuarioService.buscarPorEmail(usuarioAutenticado.email) : undefined;

  if (usuario?.perfil === 'administrador') {
    return true;
  }

  toastService.erro('Acesso restrito a administradores.');
  return router.parseUrl('/admin');
};
