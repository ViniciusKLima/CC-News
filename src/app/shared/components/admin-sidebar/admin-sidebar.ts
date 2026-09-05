import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { InterfaceConfigService } from '../../../core/services/interface-config.service';
import { labelPerfil } from '../../../core/models/usuario.model';

// Menu lateral fixo da área administrativa: navegação entre as telas do
// admin e o menu do usuário logado (perfil e sair).
@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly interfaceConfig = inject(InterfaceConfigService);

  readonly usuario = this.authService.usuario;
  readonly meuUsuario = this.authService.meuUsuario;
  readonly souAdministrador = this.authService.souAdministrador;

  readonly nomeUsuario = computed(() => this.meuUsuario()?.nome || this.usuario()?.email || '');

  // Primeira letra do nome + primeira letra logo depois do espaço (ex.:
  // "Maria Silva" -> MS). Sem espaço no nome, cai pras duas primeiras letras.
  readonly iniciaisUsuario = computed(() => {
    const nome = (this.meuUsuario()?.nome || this.usuario()?.email || '').trim();
    if (!nome) return '?';
    const indiceEspaco = nome.indexOf(' ');
    const segunda = indiceEspaco !== -1 ? nome[indiceEspaco + 1] : nome[1];
    return `${nome[0]}${segunda ?? ''}`.toUpperCase();
  });

  readonly labelMeuPerfil = computed(() => {
    const perfil = this.meuUsuario()?.perfil;
    return perfil ? labelPerfil(perfil) : '';
  });

  menuUsuarioAberto = signal(false);

  alternarMenuUsuario(evento: Event): void {
    evento.stopPropagation();
    this.menuUsuarioAberto.set(!this.menuUsuarioAberto());
  }

  async sair(): Promise<void> {
    this.menuUsuarioAberto.set(false);
    await this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }

  @HostListener('document:click')
  onCliqueForaDoMenu(): void {
    this.menuUsuarioAberto.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.menuUsuarioAberto.set(false);
  }
}
