import { Component, inject } from '@angular/core';
import { ToastService } from '../../../core/services/toast.service';

// Renderiza a fila de toasts do ToastService. Montado uma única vez no
// app.html, fora do router-outlet, para ficar disponível em qualquer tela.
@Component({
  selector: 'app-toast-host',
  imports: [],
  templateUrl: './toast.html',
  styleUrl: './toast.scss',
})
export class ToastHost {
  protected readonly toastService = inject(ToastService);
}
