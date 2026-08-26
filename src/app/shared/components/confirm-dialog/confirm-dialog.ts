import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { FecharAoClicarFora } from '../../directives/fechar-ao-clicar-fora.directive';

// Renderiza o modal de confirmação do ConfirmDialogService. Montado uma
// única vez no app.html, fica disponível em qualquer tela do sistema.
@Component({
  selector: 'app-confirm-dialog-host',
  imports: [FecharAoClicarFora],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogHost {
  protected readonly confirmDialogService = inject(ConfirmDialogService);

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.confirmDialogService.confirmacao()) {
      this.confirmDialogService.responder(false);
    }
  }
}
