import { Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToastService } from '../../../core/services/toast.service';
import { Usuario } from '../../../core/models/usuario.model';

// Os três passos da tela: login normal, verificação de e-mail e criação
// de senha no fluxo de Primeiro Acesso (usuário cadastrado pelo admin,
// mas que ainda não tem conta no Firebase Auth).
type ModoLogin = 'login' | 'verificar-email' | 'criar-senha';

const MENSAGENS_ERRO: Record<string, string> = {
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Informe um e-mail válido.',
  'auth/user-disabled': 'Esta conta está desativada.',
  'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
  'auth/network-request-failed': 'Falha de conexão. Verifique sua internet e tente novamente.',
  'auth/email-already-in-use': 'Já existe uma conta criada para este e-mail. Tente entrar normalmente.',
  'auth/weak-password': 'Escolha uma senha mais forte (mínimo de 6 caracteres).',
};

function senhasIguaisValidator(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value;
  const confirmarSenha = grupo.get('confirmarSenha')?.value;
  return senha === confirmarSenha ? null : { senhasDiferentes: true };
}

// Tela de login administrativo e fluxo de Primeiro Acesso (verificação
// de e-mail cadastrado + criação de senha).
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);

  readonly modo = signal<ModoLogin>('login');
  readonly entrando = signal(false);
  readonly verificando = signal(false);
  readonly criandoConta = signal(false);
  readonly usuarioPendente = signal<Usuario | null>(null);

  readonly mostrarSenhaLogin = signal(false);
  readonly mostrarNovaSenha = signal(false);
  readonly mostrarConfirmarSenha = signal(false);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', Validators.required],
  });

  readonly emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  readonly senhaForm = this.fb.nonNullable.group(
    {
      senha: ['', [Validators.required, Validators.minLength(6)]],
      confirmarSenha: ['', Validators.required],
    },
    { validators: senhasIguaisValidator },
  );

  campoInvalido(campo: 'email' | 'senha'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  campoEmailInvalido(): boolean {
    const controle = this.emailForm.controls.email;
    return controle.invalid && (controle.touched || controle.dirty);
  }

  campoSenhaCriacaoInvalido(campo: 'senha' | 'confirmarSenha'): boolean {
    const controle = this.senhaForm.controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  senhasNaoConferem(): boolean {
    const confirmar = this.senhaForm.controls.confirmarSenha;
    return this.senhaForm.hasError('senhasDiferentes') && (confirmar.touched || confirmar.dirty);
  }

  irParaPrimeiroAcesso(): void {
    this.emailForm.reset();
    this.modo.set('verificar-email');
  }

  voltarParaLogin(): void {
    this.usuarioPendente.set(null);
    this.modo.set('login');
  }

  // Ação de cada um dos três passos do formulário
  async entrar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { email, senha } = this.form.getRawValue();
    this.entrando.set(true);

    try {
      await this.authService.login(email, senha);
      this.router.navigateByUrl('/admin');
    } catch (erro) {
      if (erro instanceof Error && erro.message === 'conta-inativa') {
        this.toastService.erro('Sua conta foi desativada. Entre em contato com o administrador.');
      } else {
        const codigo = erro && typeof erro === 'object' && 'code' in erro ? String(erro.code) : '';
        this.toastService.erro(MENSAGENS_ERRO[codigo] ?? 'Não foi possível entrar. Tente novamente em instantes.');
      }
    } finally {
      this.entrando.set(false);
    }
  }

  async verificarEmail(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      return;
    }

    const { email } = this.emailForm.getRawValue();
    this.verificando.set(true);

    try {
      const usuario = await this.usuarioService.buscarPorEmail(email);

      if (!usuario) {
        this.toastService.erro('E-mail não permitido, entre em contato com o administrador.');
        return;
      }

      if (usuario.status === 'ativo') {
        this.toastService.erro('Conta já ativa, acesse a sua conta com seu e-mail.');
        this.form.controls.email.setValue(usuario.email);
        this.modo.set('login');
        return;
      }

      if (usuario.status === 'inativo') {
        this.toastService.erro('Conta desativada, entre em contato com o administrador.');
        return;
      }

      this.usuarioPendente.set(usuario);
      this.senhaForm.reset();
      this.modo.set('criar-senha');
    } catch {
      this.toastService.erro('Não foi possível verificar o e-mail. Tente novamente em instantes.');
    } finally {
      this.verificando.set(false);
    }
  }

  async criarSenha(): Promise<void> {
    if (this.senhaForm.invalid) {
      this.senhaForm.markAllAsTouched();
      return;
    }

    const usuario = this.usuarioPendente();
    if (!usuario) return;

    const { senha } = this.senhaForm.getRawValue();
    this.criandoConta.set(true);

    try {
      await this.authService.criarConta(usuario.email, senha);
      this.router.navigateByUrl('/admin');
    } catch (erro) {
      const codigo = erro && typeof erro === 'object' && 'code' in erro ? String(erro.code) : '';
      this.toastService.erro(MENSAGENS_ERRO[codigo] ?? 'Não foi possível criar sua senha. Tente novamente em instantes.');
    } finally {
      this.criandoConta.set(false);
    }
  }
}
