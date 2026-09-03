import { Injectable } from '@angular/core';
import { Edicao } from '../models/edition.model';

const CHAVE_PREFIXO = 'cc-news-preview:';

function gerarId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `preview-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Guarda uma edição ainda não publicada na sessionStorage, pra a página
 * pública de edição conseguir renderizá-la numa aba separada sem passar
 * pelo Firestore — usado pelo botão de pré-visualização do Editor.
 * sessionStorage é copiada para abas abertas via window.open() a partir da
 * mesma origem, então a aba de preview enxerga o dado sem precisar de
 * nenhum backend nem publicar a edição de verdade.
 */
@Injectable({ providedIn: 'root' })
export class PreviewService {
  salvar(edicao: Edicao): string {
    const id = gerarId();
    sessionStorage.setItem(`${CHAVE_PREFIXO}${id}`, JSON.stringify({ ...edicao, id }));
    return id;
  }

  obter(id: string): Edicao | undefined {
    const bruto = sessionStorage.getItem(`${CHAVE_PREFIXO}${id}`);
    if (!bruto) return undefined;
    try {
      return JSON.parse(bruto) as Edicao;
    } catch {
      return undefined;
    }
  }
}
