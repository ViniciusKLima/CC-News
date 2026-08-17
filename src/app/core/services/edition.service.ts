import { Injectable, computed, effect, signal } from '@angular/core';
import { Atualizacao, Edicao, StatusEdicao } from '../models/edition.model';

function gerarId(prefixo: string): string {
  const sufixo =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefixo}-${sufixo}`;
}

// Enquanto não existe backend, o localStorage funciona como a "fonte única"
// compartilhada entre todas as abas — admin e área pública leem e escrevem
// exatamente o mesmo estado, e mudanças em uma aba refletem nas outras.
const CHAVE_ARMAZENAMENTO = 'cc-news:edicoes';

const EDICOES_MOCK: Edicao[] = [
  {
    id: 'edicao-2026-08-25',
    capaUrl: undefined,
    titulo: 'Atualizações da Semana',
    resumo: 'Ajustes de performance e novas automações de atendimento.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-08-25', dataFim: '2026-08-31' },
    status: 'publico',
    criadoEm: '2026-08-31',
    atualizacoes: [
      {
        id: 'atualizacao-01',
        categoria: 'novidades',
        icone: 'bi-diagram-3',
        titulo: 'Seleção por departamento',
        descricao: 'Em validação a seleção de serviços e departamentos para atendimento por perfil.',
        impacto: 'Garante maior precisão na organização dos serviços.',
        visivel: true,
      },
      {
        id: 'atualizacao-02',
        categoria: 'melhorias',
        icone: 'bi-zoom-in',
        titulo: 'Melhoria no zoom dos mapas do admin',
        descricao: 'Ajuste no comportamento do zoom dos mapas utilizados nas áreas administrativas.',
        impacto: 'Facilita a visualização de informações georreferenciadas.',
        visivel: true,
      },
      {
        id: 'atualizacao-03',
        categoria: 'correcoes',
        icone: 'bi-bell',
        titulo: 'Correção na notificação de reagendamento',
        descricao: 'Correção no fluxo de notificação enviada após o reagendamento de atendimentos.',
        impacto: 'Evita retrabalho nas agendas das equipes.',
        visivel: false,
      },
      {
        id: 'atualizacao-04',
        categoria: 'testes',
        icone: 'bi-shield-lock',
        titulo: 'Restrição de módulos por tags',
        descricao: 'Em testes a possibilidade de restringir o acesso a módulos via tags de configuração.',
        impacto: 'Permite maior flexibilidade na gestão de permissões.',
        visivel: true,
      },
    ],
  },
  {
    id: 'edicao-2026-08-18',
    titulo: 'Atualizações da Semana',
    resumo: 'Melhorias no mapa da cidade e nos módulos administrativos.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-08-18', dataFim: '2026-08-24' },
    status: 'publico',
    criadoEm: '2026-08-24',
    atualizacoes: [],
  },
  {
    id: 'edicao-2026-08-11',
    titulo: 'Wallet Digital em Testes',
    resumo: 'Uma nova visão sobre carteira digital e benefícios.',
    tipo: 'especial',
    periodo: { tipo: 'especial', tema: 'Wallet Digital' },
    status: 'arquivado',
    criadoEm: '2026-08-17',
    atualizacoes: [
      {
        id: 'atualizacao-05',
        categoria: 'proximos-passos',
        icone: 'bi-wallet2',
        titulo: 'Armazenamento de documentos',
        descricao: 'Continuidade dos testes de armazenamento de documentos e benefícios digitais.',
        impacto: 'Amplia o alcance da carteira digital para novos serviços.',
        visivel: true,
      },
    ],
  },
  {
    id: 'edicao-2026-08-01',
    titulo: 'Resumo de Agosto',
    resumo: 'Panorama das principais entregas do mês.',
    tipo: 'mensal',
    periodo: { tipo: 'mensal', mes: 8, ano: 2026 },
    status: 'publico',
    criadoEm: '2026-08-10',
    atualizacoes: [],
  },
  {
    id: 'edicao-2026-07-21',
    titulo: 'Atualizações da Semana',
    resumo: 'Aprimoramentos nos fluxos de atendimento.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-07-21', dataFim: '2026-07-24' },
    status: 'publico',
    criadoEm: '2026-07-24',
    atualizacoes: [],
  },
  {
    id: 'edicao-2026-07-15',
    titulo: 'Resumo de Julho',
    resumo: 'Principais entregas e correções do mês.',
    tipo: 'mensal',
    periodo: { tipo: 'mensal', mes: 7, ano: 2026 },
    status: 'publico',
    criadoEm: '2026-07-15',
    atualizacoes: [],
  },
  {
    id: 'edicao-2026-07-07',
    titulo: 'Atualizações da Semana',
    resumo: 'Correções e melhorias de desempenho.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-07-07', dataFim: '2026-07-08' },
    status: 'arquivado',
    criadoEm: '2026-07-08',
    atualizacoes: [],
  },
  {
    id: 'edicao-2026-06-15',
    titulo: 'Destaques do Semestre',
    resumo: 'Os principais avanços da plataforma no primeiro semestre.',
    tipo: 'anual',
    periodo: { tipo: 'anual', ano: 2026 },
    status: 'publico',
    criadoEm: '2026-06-15',
    atualizacoes: [],
  },
];

/**
 * Fonte única dos dados de edições. Hoje entrega um mock local; quando o
 * Firestore for integrado, apenas o carregamento e a persistência internos
 * deste service precisam mudar — os consumidores (Home, Edição pública,
 * área administrativa) continuam lendo os mesmos signals e chamando os
 * mesmos métodos.
 */
@Injectable({ providedIn: 'root' })
export class EditionService {
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
    // TODO: substituir pelo carregamento real (Firestore) quando o backend existir.
    setTimeout(() => {
      this._edicoes.set(this.carregarDoArmazenamento() ?? EDICOES_MOCK);
      this._loading.set(false);
    }, 700);

    // Persiste qualquer mudança automaticamente (nunca durante o "carregamento"
    // inicial, para não sobrescrever dados salvos com o array vazio de partida).
    effect(() => {
      const edicoes = this._edicoes();
      if (this._loading()) return;

      try {
        localStorage.setItem(CHAVE_ARMAZENAMENTO, JSON.stringify(edicoes));
      } catch {
        // localStorage indisponível (modo privado, quota excedida etc.) — segue só em memória.
      }
    });

    // Sincroniza em tempo real com o que for alterado em outras abas/janelas.
    window.addEventListener('storage', (evento) => {
      if (evento.key !== CHAVE_ARMAZENAMENTO || !evento.newValue) return;

      try {
        this._edicoes.set(JSON.parse(evento.newValue));
      } catch {
        // valor corrompido no storage — ignora e mantém o estado atual.
      }
    });
  }

  private carregarDoArmazenamento(): Edicao[] | null {
    try {
      const bruto = localStorage.getItem(CHAVE_ARMAZENAMENTO);
      return bruto ? JSON.parse(bruto) : null;
    } catch {
      return null;
    }
  }

  obterPorId(id: string): Edicao | undefined {
    return this._edicoes().find((edicao) => edicao.id === id);
  }

  criar(dados: Omit<Edicao, 'id' | 'criadoEm' | 'atualizacoes'>): Edicao {
    const novaEdicao: Edicao = {
      ...dados,
      id: gerarId('edicao'),
      criadoEm: new Date().toISOString().slice(0, 10),
      atualizacoes: [],
    };
    this._edicoes.update((lista) => [novaEdicao, ...lista]);
    return novaEdicao;
  }

  atualizar(id: string, dados: Partial<Omit<Edicao, 'id' | 'atualizacoes'>>): void {
    this._edicoes.update((lista) => lista.map((edicao) => (edicao.id === id ? { ...edicao, ...dados } : edicao)));
  }

  atualizarStatus(id: string, status: StatusEdicao): void {
    this.atualizar(id, { status });
  }

  remover(id: string): void {
    this._edicoes.update((lista) => lista.filter((edicao) => edicao.id !== id));
  }

  adicionarAtualizacao(edicaoId: string, dados: Omit<Atualizacao, 'id'>): void {
    const nova: Atualizacao = { ...dados, id: gerarId('atualizacao') };
    this._edicoes.update((lista) =>
      lista.map((edicao) =>
        edicao.id === edicaoId ? { ...edicao, atualizacoes: [...edicao.atualizacoes, nova] } : edicao,
      ),
    );
  }

  atualizarAtualizacao(edicaoId: string, atualizacaoId: string, dados: Omit<Atualizacao, 'id'>): void {
    this._edicoes.update((lista) =>
      lista.map((edicao) =>
        edicao.id === edicaoId
          ? {
              ...edicao,
              atualizacoes: edicao.atualizacoes.map((item) =>
                item.id === atualizacaoId ? { ...dados, id: atualizacaoId } : item,
              ),
            }
          : edicao,
      ),
    );
  }

  removerAtualizacao(edicaoId: string, atualizacaoId: string): void {
    this._edicoes.update((lista) =>
      lista.map((edicao) =>
        edicao.id === edicaoId
          ? { ...edicao, atualizacoes: edicao.atualizacoes.filter((item) => item.id !== atualizacaoId) }
          : edicao,
      ),
    );
  }

  alternarVisibilidadeAtualizacao(edicaoId: string, atualizacaoId: string): void {
    this._edicoes.update((lista) =>
      lista.map((edicao) =>
        edicao.id === edicaoId
          ? {
              ...edicao,
              atualizacoes: edicao.atualizacoes.map((item) =>
                item.id === atualizacaoId ? { ...item, visivel: !item.visivel } : item,
              ),
            }
          : edicao,
      ),
    );
  }
}
