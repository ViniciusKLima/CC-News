import { Component, HostListener, inject } from '@angular/core';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog-host',
  imports: [],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.scss',
})
export class ConfirmDialogHost {
  protected readonly confirmDialogService = inject(ConfirmDialogService);

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
