import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/components/toast/toast';
import { ConfirmDialogHost } from './shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, ConfirmDialogHost],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
// Componente raiz: hospeda o router e os hosts globais de toast e
// confirmação, que ficam disponíveis para qualquer tela da aplicação.
export class App {
  protected readonly title = signal('cc-news');
}
