import { Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EditionService } from '../../../core/services/edition.service';

// Cabeçalho fixo da área pública, com o link para a última edição publicada.
@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly editionService = inject(EditionService);

  readonly ultimaEdicao = this.editionService.ultimaEdicaoPublica;

  // Dá destaque (sombra/borda) ao header fixo assim que a página rola,
  // pra ele não "sumir" fundido com o conteúdo branco logo abaixo.
  readonly rolado = signal(false);

  constructor() {
    this.rolado.set(window.scrollY > 8);
  }

  @HostListener('window:scroll')
  onScroll(): void {
    this.rolado.set(window.scrollY > 8);
  }
}
