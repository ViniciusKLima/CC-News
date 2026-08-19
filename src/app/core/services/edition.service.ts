import { Injectable, computed, inject, signal } from '@angular/core';
import {
  Firestore,
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from '@angular/fire/firestore';
import { Atualizacao, Edicao, StatusEdicao } from '../models/edition.model';
import { edicaoConverter } from '../models/edition.converter';

function gerarId(prefixo: string): string {
  const sufixo =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefixo}-${sufixo}`;
}

/**
 * Fonte única dos dados de edições, sincronizada em tempo real com a
 * coleção `edicoes` do Firestore. Os consumidores (Home, Edição pública,
 * área administrativa) só leem os signals `edicoes`/`loading` e chamam os
 * métodos públicos abaixo — nunca acessam o Firestore diretamente.
 */
@Injectable({ providedIn: 'root' })
export class EditionService {
  private readonly firestore = inject(Firestore);
  private readonly colecao = collection(this.firestore, 'edicoes').withConverter(edicaoConverter);

  private readonly _edicoes = signal<Edicao[]>([]);
  private readonly _loading = signal(true);

  readonly edicoes = this._edicoes.asReadonly();
  readonly loading = this._loading.asReadonly();

  /** Edição pública mais recente, usada pelo header para o link "Última edição". */
  readonly ultimaEdicaoPublica = computed<Edicao | undefined>(() => {
    const publicas = this._edicoes().filter((edicao) => edicao.status === 'publico');
    if (!publicas.length) return undefined;
    return [...publicas].sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))[0];
  });

  constructor() {
    onSnapshot(
      this.colecao,
      (snapshot) => {
        this._edicoes.set(snapshot.docs.map((documento) => documento.data()));
        this._loading.set(false);
      },
      (erro) => {
        console.error('Erro ao sincronizar edições do Firestore:', erro);
        this._loading.set(false);
      },
    );
  }

  obterPorId(id: string): Edicao | undefined {
    return this._edicoes().find((edicao) => edicao.id === id);
  }

  async criar(dados: Omit<Edicao, 'id' | 'criadoEm' | 'atualizacoes'>): Promise<Edicao> {
    const novaEdicao: Edicao = {
      ...dados,
      id: '',
      criadoEm: new Date().toISOString().slice(0, 10),
      atualizacoes: [],
    };
    const referencia = await addDoc(this.colecao, novaEdicao);
    return { ...novaEdicao, id: referencia.id };
  }

  async atualizar(id: string, dados: Partial<Omit<Edicao, 'id' | 'atualizacoes'>>): Promise<void> {
    const atual = this.obterPorId(id);
    if (!atual) return;
    await this.salvar({ ...atual, ...dados });
  }

  async atualizarStatus(id: string, status: StatusEdicao): Promise<void> {
    await this.atualizar(id, { status });
  }

  async remover(id: string): Promise<void> {
    await deleteDoc(doc(this.colecao, id));
  }

  async adicionarAtualizacao(edicaoId: string, dados: Omit<Atualizacao, 'id'>): Promise<void> {
    const atual = this.obterPorId(edicaoId);
    if (!atual) return;
    const nova: Atualizacao = { ...dados, id: gerarId('atualizacao') };
    await this.salvar({ ...atual, atualizacoes: [...atual.atualizacoes, nova] });
  }

  async atualizarAtualizacao(edicaoId: string, atualizacaoId: string, dados: Omit<Atualizacao, 'id'>): Promise<void> {
    const atual = this.obterPorId(edicaoId);
    if (!atual) return;
    const atualizacoes = atual.atualizacoes.map((item) =>
      item.id === atualizacaoId ? { ...dados, id: atualizacaoId } : item,
    );
    await this.salvar({ ...atual, atualizacoes });
  }

  async removerAtualizacao(edicaoId: string, atualizacaoId: string): Promise<void> {
    const atual = this.obterPorId(edicaoId);
    if (!atual) return;
    const atualizacoes = atual.atualizacoes.filter((item) => item.id !== atualizacaoId);
    await this.salvar({ ...atual, atualizacoes });
  }

  async alternarVisibilidadeAtualizacao(edicaoId: string, atualizacaoId: string): Promise<void> {
    const atual = this.obterPorId(edicaoId);
    if (!atual) return;
    const atualizacoes = atual.atualizacoes.map((item) =>
      item.id === atualizacaoId ? { ...item, visivel: !item.visivel } : item,
    );
    await this.salvar({ ...atual, atualizacoes });
  }

  /** Substitui o documento inteiro no Firestore — evita que campos limpos (ex. undefined) fiquem "presos" com o valor antigo, como aconteceria com um merge parcial. */
  private async salvar(edicao: Edicao): Promise<void> {
    await setDoc(doc(this.colecao, edicao.id), edicao);
  }
}
