import { Component, HostListener, inject, signal } from '@angular/core';
import { labelPerfil, labelStatusUsuario, Usuario } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { CONFIRMACOES } from '../../../core/services/confirm-dialog.presets';
import { AdminSidebar } from '../../../shared/components/admin-sidebar/admin-sidebar';
import { DadosFormularioUsuario, UsuarioModal } from './usuario-modal/usuario-modal';

@Component({
  selector: 'app-usuarios-internos',
  imports: [AdminSidebar, UsuarioModal],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.scss',
})
export class UsuariosInternos {
  private readonly usuarioService = inject(UsuarioService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  readonly usuarios = this.usuarioService.usuarios;
  readonly loading = this.usuarioService.loading;

  readonly skeletonLinhas = Array.from({ length: 3 });

  protected readonly labelPerfil = labelPerfil;
  protected readonly labelStatusUsuario = labelStatusUsuario;

  menuAbertoId = signal<string | null>(null);
  modalAberto = signal<{ usuarioEditando: Usuario | null } | null>(null);

  abrirModalNovoUsuario(): void {
    this.modalAberto.set({ usuarioEditando: null });
  }

  abrirModalEditar(usuario: Usuario): void {
    this.fecharMenu();
    this.modalAberto.set({ usuarioEditando: usuario });
  }

  fecharModal(): void {
    this.modalAberto.set(null);
  }

  async salvarUsuario(dados: DadosFormularioUsuario): Promise<void> {
    const modal = this.modalAberto();
    if (!modal) return;

    try {
      if (modal.usuarioEditando) {
        await this.usuarioService.atualizar(modal.usuarioEditando.id, {
          nome: dados.nome,
          email: dados.email,
          perfil: dados.perfil,
          status: dados.status,
        });
        this.toastService.sucesso('Usuário atualizado com sucesso.');
      } else {
        await this.usuarioService.criar({ nome: dados.nome, email: dados.email, perfil: dados.perfil });
        this.toastService.sucesso('Usuário adicionado com sucesso.');
      }
      this.fecharModal();
    } catch (erro) {
      if (erro instanceof Error && erro.message === 'email-ja-cadastrado') {
        this.toastService.erro('Já existe um usuário cadastrado com este e-mail.');
      } else if (erro instanceof Error && erro.message === 'email-nao-editavel') {
        this.toastService.erro('O e-mail não pode ser alterado depois que a conta é ativada.');
      } else if (erro instanceof Error && erro.message === 'usuario-nao-encontrado') {
        this.toastService.erro('Esse usuário não existe mais — provavelmente foi excluído em outra sessão.');
        this.fecharModal();
      } else {
        this.toastService.erro('Não foi possível salvar o usuário. Tente novamente em instantes.');
      }
    }
  }

  async excluir(usuario: Usuario): Promise<void> {
    this.fecharMenu();
    const confirmado = await this.confirmDialogService.confirmar(
      CONFIRMACOES.excluirUsuario(usuario.nome, !!usuario.uid),
    );
    if (!confirmado) return;

    try {
      await this.usuarioService.remover(usuario.id);
      this.toastService.sucesso('Usuário excluído com sucesso.');
    } catch {
      this.toastService.erro('Não foi possível excluir o usuário. Tente novamente em instantes.');
    }
  }

  formatarUltimoAcesso(usuario: Usuario): string {
    if (!usuario.ultimoAcesso) return 'Nunca acessou';
    return new Date(usuario.ultimoAcesso).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  alternarMenu(id: string, evento: Event): void {
    evento.stopPropagation();
    this.menuAbertoId.set(this.menuAbertoId() === id ? null : id);
  }

  fecharMenu(): void {
    this.menuAbertoId.set(null);
  }

  @HostListener('document:click')
  onCliqueForaDoMenu(): void {
    this.fecharMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fecharMenu();
  }
}
