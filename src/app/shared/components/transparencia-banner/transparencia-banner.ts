import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Icone } from '../icone/icone';

// Banner de transparência exibido no rodapé de toda edição pública. Usado
// também como prévia (somente leitura) na aba Aparência do admin — mesmo
// componente, mesmo CSS, pra a prévia mostrar exatamente como o banner vai
// ficar no ar. A edição de texto e ícone em si acontece por campos de
// formulário normais (ver aparencia.html), não direto em cima deste
// componente.
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

  protected readonly linkExterno = computed(() => this.linkBotao().startsWith('http'));
}
