import { Component, HostListener, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Auth, sendPasswordResetEmail } from '@angular/fire/auth';
import { PERFIS_ACESSO, PerfilAcesso, StatusUsuario, Usuario } from '../../../../core/models/usuario.model';
import { ToastService } from '../../../../core/services/toast.service';
import { FecharAoClicarFora } from '../../../../shared/directives/fechar-ao-clicar-fora.directive';

export interface DadosFormularioUsuario {
  nome: string;
  email: string;
  perfil: PerfilAcesso;
  status: StatusUsuario;
}

// Modal de criação/edição de um usuário interno. O e-mail só fica editável
// enquanto a conta ainda está pendente (contaJaAtivada), já que o ID do
// documento no Firestore é o próprio e-mail (ver UsuarioService).
@Component({
  selector: 'app-usuario-modal',
  imports: [ReactiveFormsModule, FecharAoClicarFora],
  templateUrl: './usuario-modal.html',
  styleUrl: './usuario-modal.scss',
})
export class UsuarioModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly toastService = inject(ToastService);

  readonly usuarioEditando = input<Usuario | null>(null);

  readonly salvar = output<DadosFormularioUsuario>();
  readonly fechar = output<void>();

  readonly perfisAcesso = PERFIS_ACESSO;

  readonly form = this.fb.nonNullable.group({
    nome: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    perfil: ['editor' as PerfilAcesso, Validators.required],
    status: ['ativo' as StatusUsuario, Validators.required],
  });

  ngOnInit(): void {
    const editando = this.usuarioEditando();
    if (editando) {
      this.form.setValue({
        nome: editando.nome,
        email: editando.email,
        perfil: editando.perfil,
        status: editando.status,
      });
    }
  }

  get modoEdicao(): boolean {
    return !!this.usuarioEditando();
  }

  get contaJaAtivada(): boolean {
    return !!this.usuarioEditando()?.uid;
  }

  campoInvalido(campo: 'nome' | 'email' | 'perfil'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  async reenviarSenha(): Promise<void> {
    const usuario = this.usuarioEditando();
    if (!usuario) return;

    try {
      await sendPasswordResetEmail(this.auth, usuario.email);
      this.toastService.sucesso('E-mail de redefinição de senha enviado.');
    } catch {
      this.toastService.erro('Não foi possível enviar o e-mail de redefinição. Tente novamente.');
    }
  }

  onSalvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    this.salvar.emit({
      nome: valores.nome.trim(),
      email: valores.email.trim(),
      perfil: valores.perfil,
      status: this.modoEdicao ? valores.status : 'pendente',
    });
  }

  onFechar(): void {
    this.fechar.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onFechar();
  }
}
