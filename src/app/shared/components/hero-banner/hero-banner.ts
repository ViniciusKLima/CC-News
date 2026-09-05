import { Component, computed, input, output } from '@angular/core';

// Hero de abertura da home: imagem de fundo, título (kicker + destaque) e
// parágrafo. Usado tanto na home pública (somente leitura) quanto na aba
// Aparência do admin (modo `editavel`, ver aparencia.ts) — mesmo componente,
// mesmo CSS, pra o admin ver exatamente como o hero vai ficar no ar enquanto
// edita o texto direto em cima dele.
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

  /** Modo de edição: os textos viram contenteditable e emitem as mudanças no blur. */
  readonly editavel = input(false);
  /** Versão mais baixa, usada dentro do card da aba Aparência (o hero real ocupa 60% da altura da tela, o que não cabe bem dentro de um formulário). */
  readonly compacto = input(false);

  protected readonly posicaoMobileCss = computed(() => `${this.focoMobileX()}% center`);

  readonly tituloKickerChange = output<string>();
  readonly tituloChange = output<string>();
  readonly textoChange = output<string>();

  protected onBlurKicker(evento: Event): void {
    this.tituloKickerChange.emit((evento.target as HTMLElement).innerText.trim());
  }

  protected onBlurTitulo(evento: Event): void {
    this.tituloChange.emit((evento.target as HTMLElement).innerText.trim());
  }

  protected onBlurTexto(evento: Event): void {
    this.textoChange.emit((evento.target as HTMLElement).innerText.trim());
  }
}
