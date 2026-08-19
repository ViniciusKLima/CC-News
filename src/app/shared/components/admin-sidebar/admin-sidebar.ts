import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { labelPerfil } from '../../../core/models/usuario.model';

@Component({
  selector: 'app-admin-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './admin-sidebar.html',
  styleUrl: './admin-sidebar.scss',
})
export class AdminSidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly usuario = this.authService.usuario;
  readonly meuUsuario = this.authService.meuUsuario;
  readonly souAdministrador = this.authService.souAdministrador;

  readonly iniciaisUsuario = computed(() => (this.usuario()?.email ?? '?').slice(0, 2).toUpperCase());
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
