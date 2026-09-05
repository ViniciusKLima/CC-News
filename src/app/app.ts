import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastHost } from './shared/components/toast/toast';
import { ConfirmDialogHost } from './shared/components/confirm-dialog/confirm-dialog';
import { InterfaceConfigService } from './core/services/interface-config.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastHost, ConfirmDialogHost],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
// Componente raiz: hospeda o router e os hosts globais de toast e
// confirmação, que ficam disponíveis para qualquer tela da aplicação.
export class App {
  private readonly interfaceConfig = inject(InterfaceConfigService);

  protected readonly title = signal('cc-news');

  // O favicon é uma tag <link> fixa no index.html, fora do que o Angular
  // renderiza — por isso é atualizada aqui, direto no DOM, sempre que o
  // favicon configurado em Aparência mudar.
  constructor() {
    effect(() => {
      const url = this.interfaceConfig.config().faviconUrl;
      const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (link) link.href = url;
    });
  }
}
