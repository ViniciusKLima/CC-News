import { Component, input, output } from '@angular/core';
import { Atualizacao, corCategoriaAtualizacao, labelCategoria } from '../../../core/models/edition.model';
import { urlImagemOtimizada } from '../../../core/services/cloudinary.service';
import { extrairIdYoutube, urlThumbnailYoutube } from '../../../core/utils/youtube.util';

// Card de uma atualização: mídia, ícone e categoria, título, descrição e
// impacto. Usado tanto no admin (que projeta os botões de ação por cima,
// via a diretiva cardAcoes) quanto na edição pública, pra manter a mesma
// aparência nos dois lugares.
@Component({
  selector: 'app-atualizacao-card',
  imports: [],
  templateUrl: './atualizacao-card.html',
  styleUrl: './atualizacao-card.scss',
})
export class AtualizacaoCard {
  readonly atualizacao = input.required<Atualizacao>();
  // No admin a mídia não abre lightbox (o Editor não tem essa tela), então
  // fica sem cursor de zoom e sem clique.
  readonly interativo = input(true);

  readonly ampliarImagem = output<string>();
  readonly ampliarVideo = output<string>();

  protected readonly labelCategoria = labelCategoria;
  protected readonly urlImagemOtimizada = urlImagemOtimizada;
  protected readonly extrairIdYoutube = extrairIdYoutube;
  protected readonly urlThumbnailYoutube = urlThumbnailYoutube;

  protected corCategoria(): string {
    return corCategoriaAtualizacao(this.atualizacao().categoria);
  }

  protected onImagemClick(url: string): void {
    if (this.interativo()) this.ampliarImagem.emit(url);
  }

  protected onVideoClick(videoId: string): void {
    if (this.interativo()) this.ampliarVideo.emit(videoId);
  }
}
