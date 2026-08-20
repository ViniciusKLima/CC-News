import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Auth, signOut, user } from '@angular/fire/auth';
import { firstValueFrom } from 'rxjs';
import { UsuarioService } from '../services/usuario.service';
import { ToastService } from '../services/toast.service';

// Guard de rota: exige usuário autenticado no Firebase Auth e com cadastro
// ativo na coleção de usuários internos antes de liberar o acesso ao admin.
export const authGuard: CanActivateFn = async () => {
  const auth = inject(Auth);
  const usuarioService = inject(UsuarioService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const usuarioAutenticado = await firstValueFrom(user(auth));
  if (!usuarioAutenticado?.email) {
    return router.parseUrl('/admin/login');
  }

  const usuario = await usuarioService.buscarPorEmail(usuarioAutenticado.email);

  // Lista de permissão, não de bloqueio: só passa quem tem registro E está
  // com status "ativo". Cobre tanto conta desativada quanto conta cujo
  // registro foi apagado (usuario === undefined). Nos dois casos a sessão
  // do Firebase Auth pode continuar tecnicamente válida no navegador, mas
  // o acesso ao admin tem que ser negado.
  if (usuario?.status !== 'ativo') {
    await signOut(auth);
    toastService.erro(
      usuario
        ? 'Sua conta foi desativada. Entre em contato com o administrador.'
        : 'Sua conta foi removida. Entre em contato com o administrador.',
    );
    return router.parseUrl('/admin/login');
  }

  // "Último acesso" reflete o uso real da plataforma, não só o momento do
  // login: atualiza a cada navegação por uma rota protegida (o guard roda
  // em toda troca de página dentro do admin).
  usuarioService.registrarAcesso(usuario.email);

  return true;
};
