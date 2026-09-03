import { Injectable } from '@angular/core';

const PREFIXO_CHAVE = 'cc-news-rascunho:';

export interface RascunhoSalvo<T> {
  salvoEm: string;
  dados: T;
}

/**
 * Guarda uma cópia de segurança do formulário do Editor na localStorage
 * enquanto o admin ainda não clicou em Salvar — protege contra perda de
 * trabalho em casos de F5 acidental, fechamento da aba ou queda de conexão.
 * Não substitui o botão Salvar: o rascunho nunca é publicado sozinho no
 * Firestore, só fica disponível pra ser restaurado no formulário na
 * próxima vez que o Editor for aberto (ver Editor.aplicarRascunho).
 */
@Injectable({ providedIn: 'root' })
export class RascunhoService {
  private chave(edicaoId: string | null): string {
    return `${PREFIXO_CHAVE}${edicaoId ?? 'nova'}`;
  }

  salvar<T>(edicaoId: string | null, dados: T): void {
    try {
      const rascunho: RascunhoSalvo<T> = { salvoEm: new Date().toISOString(), dados };
      localStorage.setItem(this.chave(edicaoId), JSON.stringify(rascunho));
    } catch {
      // localStorage indisponível (modo privado, quota cheia etc.): perde só
      // a recuperação automática, não afeta o uso normal do editor.
    }
  }

  obter<T>(edicaoId: string | null): RascunhoSalvo<T> | null {
    try {
      const bruto = localStorage.getItem(this.chave(edicaoId));
      return bruto ? (JSON.parse(bruto) as RascunhoSalvo<T>) : null;
    } catch {
      return null;
    }
  }

  limpar(edicaoId: string | null): void {
    try {
      localStorage.removeItem(this.chave(edicaoId));
    } catch {
      // ignora
    }
  }
}
