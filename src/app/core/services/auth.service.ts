import { Injectable, computed, effect, inject, signal } from '@angular/core';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Usuario, normalizarEmail } from '../models/usuario.model';
import { UsuarioService } from './usuario.service';
import { ToastService } from './toast.service';

// Camada de autenticação: envolve o Firebase Auth (login, criação de conta
// e logout) e mantém sincronizado o perfil correspondente na coleção de
// usuários internos, incluindo o encerramento forçado de sessão quando a
// conta é desativada ou removida.
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly auth = inject(Auth);
  private readonly usuarioService = inject(UsuarioService);
  private readonly router = inject(Router);
  private readonly toastService = inject(ToastService);

  private readonly _usuario = signal<User | null | undefined>(undefined);
  private readonly _carregando = signal(true);
  // undefined = ainda não resolveu; null = resolveu e confirmou que o
  // registro não existe (apagado) ou não foi encontrado; Usuario = resolveu e achou.
  private readonly _meuUsuario = signal<Usuario | null | undefined>(undefined);

  readonly usuario = this._usuario.asReadonly();
  readonly carregando = this._carregando.asReadonly();
  readonly autenticado = computed(() => !!this._usuario());

  /** Perfil (Firestore) correspondente à conta autenticada: nome, perfil de acesso, status etc. */
  readonly meuUsuario = this._meuUsuario.asReadonly();
  readonly souAdministrador = computed(() => this._meuUsuario()?.perfil === 'administrador');

  private pararSincronizacaoUsuario: (() => void) | null = null;

  constructor() {
    onAuthStateChanged(this.auth, (usuario) => {
      this._usuario.set(usuario);
      this._carregando.set(false);
      this.sincronizarMeuUsuario(usuario?.email ?? null);
    });

    // Segurança em tempo real: se a conta for apagada ou desativada
    // enquanto a pessoa já está com uma sessão aberta no app (sem precisar
    // navegar pra outra rota pro guard rodar de novo), derruba a sessão na
    // hora. Não basta bloquear só na próxima navegação.
    effect(() => {
      const usuarioFirebase = this._usuario();
      const perfil = this._meuUsuario();

      if (usuarioFirebase === undefined || perfil === undefined) return; // ainda carregando
      if (!usuarioFirebase) return; // deslogado, nada a fazer aqui

      if (perfil === null) {
        this.forcarSaida('Sua conta foi removida.');
      } else if (perfil.status === 'inativo') {
        this.forcarSaida('Sua conta foi desativada.');
      }
    });
  }

  async login(email: string, senha: string): Promise<void> {
    const emailNormalizado = normalizarEmail(email);
    await signInWithEmailAndPassword(this.auth, emailNormalizado, senha);
    const usuario = await this.usuarioService.buscarPorEmail(emailNormalizado);

    if (usuario?.status !== 'ativo') {
      await signOut(this.auth);
      throw new Error('conta-inativa');
    }
    // "Último acesso" é atualizado pelo authGuard a cada navegação por uma
    // rota protegida (incluindo a que acontece logo após este login).
  }

  /** Cria a conta no Firebase Auth e ativa o registro correspondente. Usado no fluxo de Primeiro Acesso. */
  async criarConta(email: string, senha: string): Promise<void> {
    const emailNormalizado = normalizarEmail(email);
    const credencial = await createUserWithEmailAndPassword(this.auth, emailNormalizado, senha);
    await this.usuarioService.ativar(emailNormalizado, credencial.user.uid);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }

  private sincronizarMeuUsuario(email: string | null): void {
    this.pararSincronizacaoUsuario?.();
    this.pararSincronizacaoUsuario = null;
    this._meuUsuario.set(undefined);

    if (!email) return;

    this.pararSincronizacaoUsuario = this.usuarioService.observarPorEmail(email, (usuario) => {
      this._meuUsuario.set(usuario ?? null);
    });
  }

  private forcarSaida(motivo: string): void {
    signOut(this.auth);
    this.toastService.erro(`${motivo} Faça login novamente.`);
    this.router.navigateByUrl('/admin/login');
  }
}
