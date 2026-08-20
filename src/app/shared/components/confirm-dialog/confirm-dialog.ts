import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

// Renderiza o modal de confirmação do ConfirmDialogService. Montado uma
// única vez no app.html, fica disponível em qualquer tela do sistema.
@Component({
  selector: 'app-confirm-dialog-host',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogHost {
  protected readonly confirmDialogService = inject(ConfirmDialogService);

  // Clique fora do painel ou tecla Esc cancelam a confirmação
  onBackdropClick(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) {
      this.confirmDialogService.responder(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmDialogService.confirmacao()) {
      this.confirmDialogService.responder(false);
    }
  }
}
