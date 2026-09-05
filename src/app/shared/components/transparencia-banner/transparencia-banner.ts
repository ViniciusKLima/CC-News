import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../icone/icone';

// Banner de transparência exibido no rodapé de toda edição pública. Usado
// também na aba Aparência do admin (modo `editavel`, ver aparencia.ts) —
// mesmo componente, mesmo CSS, pra o admin editar o texto direto em cima do
// visual real em vez de adivinhar como vai ficar a partir de um formulário.
@Component({
  selector: 'app-transparencia-banner',
  imports: [RouterLink, Icone],
  templateUrl: './transparencia-banner.html',
  styleUrl: './transparencia-banner.scss',
})
export class TransparenciaBanner {
  readonly icone = input.required<string>();
  readonly titulo = input.required<string>();
  readonly descricao = input.required<string>();
  readonly textoBotao = input.required<string>();
  readonly linkBotao = input.required<string>();

  /** Modo de edição: título/descrição/texto do botão viram contenteditable, e o ícone vira um botão clicável em vez de um link real. */
  readonly editavel = input(false);

  readonly tituloChange = output<string>();
  readonly descricaoChange = output<string>();
  readonly textoBotaoChange = output<string>();
  readonly trocarIcone = output<void>();

  protected readonly linkExterno = computed(() => this.linkBotao().startsWith('http'));

  protected onBlurTitulo(evento: Event): void {
    this.tituloChange.emit((evento.target as HTMLElement).innerText.trim());
  }

  protected onBlurDescricao(evento: Event): void {
    this.descricaoChange.emit((evento.target as HTMLElement).innerText.trim());
  }

  protected onBlurBotao(evento: Event): void {
    this.textoBotaoChange.emit((evento.target as HTMLElement).innerText.trim());
  }
}
