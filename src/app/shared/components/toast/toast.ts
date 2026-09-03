import { Component, inject } from '@angular/core';
import { DURACAO_TOAST_MS, ToastService } from '../../../core/services/toast.service';

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
  // Passada pro template pra animar a barra de progresso na mesma duração
  // que o ToastService usa pra fechar o toast sozinho — se um dia mudar
  // num lugar, o outro acompanha.
  protected readonly duracaoMs = DURACAO_TOAST_MS;
}
