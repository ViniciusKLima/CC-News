import { Injectable, signal } from '@angular/core';
import { Edicao } from '../models/edition.model';

const EDICOES_MOCK: Edicao[] = [
  {
    id: 'edicao-2026-08-25',
    titulo: 'Atualizações da Semana',
    subtitulo: 'Ajustes de performance e novas automações de atendimento',
    periodo: '25 a 31 de agosto',
    tipo: 'Semanal',
    status: 'publicada',
    totalNovidades: 9,
    mes: 8,
    ano: 2026,
  },
  {
    id: 'edicao-2026-08-18',
    titulo: 'Atualizações da Semana',
    subtitulo: 'Melhorias no mapa da cidade e nos módulos administrativos',
    periodo: '18 a 24 de agosto',
    tipo: 'Semanal',
    status: 'publicada',
    totalNovidades: 11,
    mes: 8,
    ano: 2026,
  },
  {
    id: 'edicao-2026-08-11',
    titulo: 'Wallet Digital em Testes',
    subtitulo: 'Uma nova visão sobre carteira digital e benefícios',
    periodo: '11 a 17 de agosto',
    tipo: 'Especial',
    status: 'rascunho',
    totalNovidades: 5,
    mes: 8,
    ano: 2026,
  },
  {
    id: 'edicao-2026-08-01',
    titulo: 'Resumo de Agosto',
    subtitulo: 'Panorama das principais entregas do mês',
    periodo: '01 a 10 de agosto',
    tipo: 'Mensal',
    status: 'publicada',
    totalNovidades: 15,
    mes: 8,
    ano: 2026,
  },
  {
    id: 'edicao-2026-07-21',
    titulo: 'Atualizações da Semana',
    subtitulo: 'Aprimoramentos nos fluxos de atendimento',
    periodo: '21 a 24 de julho',
    tipo: 'Semanal',
    status: 'publicada',
    totalNovidades: 10,
    mes: 7,
    ano: 2026,
  },
  {
    id: 'edicao-2026-07-15',
    titulo: 'Resumo de Julho',
    subtitulo: 'Principais entregas e correções do mês',
    periodo: '15 de julho',
    tipo: 'Mensal',
    status: 'publicada',
    totalNovidades: 18,
    mes: 7,
    ano: 2026,
  },
  {
    id: 'edicao-2026-07-07',
    titulo: 'Atualizações da Semana',
    subtitulo: 'Correções e melhorias de desempenho',
    periodo: '07 a 08 de julho',
    tipo: 'Semanal',
    status: 'rascunho',
    totalNovidades: 7,
    mes: 7,
    ano: 2026,
  },
  {
    id: 'edicao-2026-06-23',
    titulo: 'Atualizações da Semana',
    subtitulo: 'Mais praticidade para gestores municipais',
    periodo: '23 a 26 de junho',
    tipo: 'Semanal',
    status: 'publicada',
    totalNovidades: 9,
    mes: 6,
    ano: 2026,
  },
  {
    id: 'edicao-2026-06-15',
    titulo: 'Destaques do Semestre',
    subtitulo: 'Os principais avanços da plataforma no primeiro semestre',
    periodo: '15 de junho',
    tipo: 'Especial',
    status: 'publicada',
    totalNovidades: 21,
    mes: 6,
    ano: 2026,
  },
  {
    id: 'edicao-2026-06-02',
    titulo: 'Atualizações da Semana',
    subtitulo: 'Novos ajustes chegam à plataforma',
    periodo: '02 a 05 de junho',
    tipo: 'Semanal',
    status: 'publicada',
    totalNovidades: 6,
    mes: 6,
    ano: 2026,
  },
];

/**
 * Fonte única dos dados de edições. Hoje entrega um mock local; quando o
 * Firestore for integrado, apenas o carregamento interno deste service
 * precisa mudar — os consumidores (Home, Edição, área administrativa)
 * continuam lendo os mesmos signals.
 */
@Injectable({ providedIn: 'root' })
export class EditionService {
  private readonly _edicoes = signal<Edicao[]>([]);
  private readonly _loading = signal(true);

  readonly edicoes = this._edicoes.asReadonly();
  readonly loading = this._loading.asReadonly();

  constructor() {
    // TODO: substituir pelo carregamento real (Firestore) quando o backend existir.
    setTimeout(() => {
      this._edicoes.set(EDICOES_MOCK);
      this._loading.set(false);
    }, 700);
  }

  obterPorId(id: string): Edicao | undefined {
    return this._edicoes().find((edicao) => edicao.id === id);
  }

  alternarStatus(id: string): void {
    this._edicoes.update((lista) =>
      lista.map((edicao) =>
        edicao.id === id
          ? { ...edicao, status: edicao.status === 'publicada' ? 'rascunho' : 'publicada' }
          : edicao,
      ),
    );
  }

  remover(id: string): void {
    this._edicoes.update((lista) => lista.filter((edicao) => edicao.id !== id));
  }
}
