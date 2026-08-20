import { Injectable, signal } from '@angular/core';

export interface ConfirmacaoOpcoes {
  titulo: string;
  descricao: string;
  rotuloConfirmar?: string;
  rotuloCancelar?: string;
  variante?: 'perigo' | 'padrao';
}

interface ConfirmacaoAtiva {
  titulo: string;
  descricao: string;
  rotuloConfirmar: string;
  rotuloCancelar: string;
  variante: 'perigo' | 'padrao';
}

/**
 * Substitui `window.confirm()` por um modal próprio. Uso:
 *
 *   const confirmado = await confirmDialogService.confirmar(CONFIRMACOES.excluirEdicao(edicao.titulo));
 *   if (!confirmado) return;
 *   await editionService.remover(edicao.id); // a ação em si continua no componente que chamou
 *
 * Os textos reutilizáveis (título/descrição/rótulo do botão) ficam
 * catalogados em `confirm-dialog.presets.ts`. A função que roda depois
 * da confirmação não faz parte do preset, cada chamador decide a sua.
 */
@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private readonly _confirmacao = signal<ConfirmacaoAtiva | null>(null);
  readonly confirmacao = this._confirmacao.asReadonly();

  private resolver: ((valor: boolean) => void) | null = null;

  confirmar(opcoes: ConfirmacaoOpcoes): Promise<boolean> {
    this._confirmacao.set({
      titulo: opcoes.titulo,
      descricao: opcoes.descricao,
      rotuloConfirmar: opcoes.rotuloConfirmar ?? 'Confirmar',
      rotuloCancelar: opcoes.rotuloCancelar ?? 'Cancelar',
      variante: opcoes.variante ?? 'padrao',
    });

    return new Promise<boolean>((resolve) => {
      this.resolver = resolve;
    });
  }

  responder(valor: boolean): void {
    this.resolver?.(valor);
    this.resolver = null;
    this._confirmacao.set(null);
  }
}
