import { Injectable, signal } from '@angular/core';

export type TipoToast = 'sucesso' | 'erro';

export interface Toast {
  id: number;
  tipo: TipoToast;
  mensagem: string;
}

const DURACAO_MS = 4500;

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly _toasts = signal<Toast[]>([]);
  readonly toasts = this._toasts.asReadonly();

  private proximoId = 1;

  sucesso(mensagem: string): void {
    this.exibir('sucesso', mensagem);
  }

  erro(mensagem: string): void {
    this.exibir('erro', mensagem);
  }

  fechar(id: number): void {
    this._toasts.update((lista) => lista.filter((toast) => toast.id !== id));
  }

  private exibir(tipo: TipoToast, mensagem: string): void {
    const id = this.proximoId++;
    this._toasts.update((lista) => [...lista, { id, tipo, mensagem }]);
    setTimeout(() => this.fechar(id), DURACAO_MS);
  }
}
