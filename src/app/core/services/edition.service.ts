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
import { Edicao, StatusEdicao } from '../models/edition.model';
import { edicaoConverter } from '../models/edition.converter';

/**
 * Fonte única dos dados de edições, sincronizada em tempo real com a
 * coleção `edicoes` do Firestore. Os consumidores (Home, Edição pública,
 * área administrativa) só leem os signals `edicoes`/`loading` e chamam os
 * métodos públicos abaixo, nunca acessam o Firestore diretamente.
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

  /** Usado pela rota pública /edicao/:id, que aceita tanto o id real quanto a URL personalizada (slug) da edição. */
  obterPorIdOuSlug(valor: string): Edicao | undefined {
    return this._edicoes().find((edicao) => edicao.id === valor || edicao.slug === valor);
  }

  // O formulário do Editor mantém a lista de atualizações em memória e só
  // manda tudo pro Firestore quando o admin clica em Salvar (criar ou
  // atualizar abaixo), nunca a cada ação isolada. Assim nada aparece pro
  // público no meio de uma edição em andamento.

  async criar(dados: Omit<Edicao, 'id' | 'criadoEm'>): Promise<Edicao> {
    const novaEdicao: Edicao = {
      ...dados,
      id: '',
      criadoEm: new Date().toISOString().slice(0, 10),
    };
    const referencia = await addDoc(this.colecao, novaEdicao);
    return { ...novaEdicao, id: referencia.id };
  }

  async atualizar(id: string, dados: Partial<Omit<Edicao, 'id'>>): Promise<void> {
    const atual = this.obterPorId(id);
    if (!atual) return;
    await this.salvar({ ...atual, ...dados });
  }

  async atualizarStatus(id: string, status: StatusEdicao): Promise<void> {
    await this.atualizar(id, { status });
  }

  async atualizarFixada(id: string, fixada: boolean): Promise<void> {
    await this.atualizar(id, { fixada });
  }

  async remover(id: string): Promise<void> {
    await deleteDoc(doc(this.colecao, id));
  }

  /** Substitui o documento inteiro no Firestore. Evita que campos limpos (ex. undefined) fiquem "presos" com o valor antigo, como aconteceria com um merge parcial. */
  private async salvar(edicao: Edicao): Promise<void> {
    await setDoc(doc(this.colecao, edicao.id), edicao);
  }
}
