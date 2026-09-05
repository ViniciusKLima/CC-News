import { Component, computed, input } from '@angular/core';

// Hero de abertura da home: imagem de fundo, título (kicker + destaque) e
// parágrafo. Usado tanto na home pública quanto como prévia (somente
// leitura) na aba Aparência do admin — mesmo componente, mesmo CSS, pra a
// prévia mostrar exatamente como o hero vai ficar no ar. A edição de texto
// em si acontece por campos de formulário normais (ver aparencia.html), não
// direto em cima deste componente.
@Component({
  selector: 'app-hero-banner',
  imports: [],
  templateUrl: './hero-banner.html',
  styleUrl: './hero-banner.scss',
})
export class HeroBanner {
  readonly imagemUrl = input.required<string>();
  readonly tituloKicker = input.required<string>();
  readonly titulo = input.required<string>();
  readonly texto = input.required<string>();
  /** Ponto horizontal (0 a 100) que fica centralizado no recorte visível quando a tela é estreita demais pra mostrar o banner inteiro. No desktop a posição é sempre "direita", pensada pro banner recomendado. */
  readonly focoMobileX = input(50);

  /** Versão mais baixa, usada dentro do card da aba Aparência (o hero real ocupa 60% da altura da tela, o que não cabe bem dentro de um formulário). */
  readonly compacto = input(false);

  protected readonly posicaoMobileCss = computed(() => `${this.focoMobileX()}% center`);
}
