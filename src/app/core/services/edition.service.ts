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
const CHAVE_VERSAO_MOCK = 'cc-news:edicoes:versao-mock';

// Sobe sempre que EDICOES_MOCK abaixo muda de conteúdo. Sem isso, quem já
// tinha dados salvos no localStorage (de um teste anterior) nunca veria as
// atualizações feitas aqui no código — o localStorage sempre "vencia" o mock.
const VERSAO_MOCK_ATUAL = '2026-08-17-conteudo-demo';

const EDICOES_MOCK: Edicao[] = [
  {
    id: 'edicao-2026-08-25',
    capaUrl: undefined,
    titulo: 'Atualizações da Semana',
    resumo: 'Ajustes de performance e novas automações de atendimento, além da Wallet Digital em fase final de testes.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-08-25', dataFim: '2026-08-31' },
    status: 'publico',
    criadoEm: '2026-08-31',
    servicoDestaque: {
      titulo: 'Wallet Digital chega para todos os municípios',
      descricao:
        'A carteira digital do cidadão sai da fase de testes e passa a armazenar documentos, comprovantes e benefícios em um único lugar, direto pelo app.',
      imagemUrl: 'https://picsum.photos/seed/ccnews-wallet/900/650',
      imagemPosicao: 'centro',
      cor: 'roxo',
    },
    atualizacoes: [
      {
        id: 'atualizacao-01',
        categoria: 'novidades',
        icone: 'bi-diagram-3',
        titulo: 'Seleção por departamento',
        descricao: 'Em validação a seleção de serviços e departamentos para atendimento por perfil.',
        impacto: 'Garante maior precisão na organização dos serviços.',
        midia: { tipo: 'imagem', url: 'https://picsum.photos/seed/ccnews-atendimento/900/650' },
        visivel: true,
      },
      {
        id: 'atualizacao-02',
        categoria: 'melhorias',
        icone: 'bi-zoom-in',
        titulo: 'Melhoria no zoom dos mapas do admin',
        descricao: 'Ajuste no comportamento do zoom dos mapas utilizados nas áreas administrativas.',
        impacto: 'Facilita a visualização de informações georreferenciadas.',
        midia: { tipo: 'imagem', url: 'https://picsum.photos/seed/ccnews-mapa/900/650' },
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
        midia: { tipo: 'video', url: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/friday.mp4' },
        visivel: true,
      },
      {
        id: 'atualizacao-06',
        categoria: 'proximos-passos',
        icone: 'bi-bell',
        titulo: 'Central de notificações unificada',
        descricao: 'Reunir alertas de atendimento, tributos e serviços em um único painel de notificações.',
        impacto: 'Reduz a dispersão de avisos entre os diferentes módulos.',
        visivel: true,
      },
    ],
  },
  {
    id: 'edicao-2026-08-18',
    titulo: 'Atualizações da Semana',
    resumo: 'Assinatura digital de requerimentos e um novo assistente de atendimento em fase de testes.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-08-18', dataFim: '2026-08-24' },
    status: 'publico',
    criadoEm: '2026-08-24',
    atualizacoes: [
      {
        id: 'atualizacao-07',
        categoria: 'novidades',
        icone: 'bi-file-earmark-text',
        titulo: 'Assinatura digital de requerimentos',
        descricao: 'Cidadãos agora podem assinar requerimentos digitalmente, sem precisar comparecer presencialmente.',
        impacto: 'Reduz deslocamentos e agiliza a abertura de processos.',
        midia: { tipo: 'imagem', url: 'https://picsum.photos/seed/ccnews-permissoes/900/650' },
        visivel: true,
      },
      {
        id: 'atualizacao-08',
        categoria: 'correcoes',
        icone: 'bi-tools',
        titulo: 'Ajuste no cálculo de taxas municipais',
        descricao: 'Correção em um arredondamento incorreto no cálculo de taxas de alguns serviços.',
        impacto: 'Garante que os valores exibidos batem exatamente com a guia de pagamento.',
        visivel: true,
      },
      {
        id: 'atualizacao-09',
        categoria: 'testes',
        icone: 'bi-lightning-charge',
        titulo: 'Assistente de atendimento com IA',
        descricao: 'Em teste com equipes internas um assistente que sugere respostas para dúvidas frequentes.',
        impacto: 'Deve reduzir o tempo médio de resposta ao cidadão.',
        midia: { tipo: 'video', url: 'https://download.samplelib.com/mp4/sample-5s.mp4' },
        visivel: true,
      },
      {
        id: 'atualizacao-10',
        categoria: 'proximos-passos',
        icone: 'bi-signpost-2',
        titulo: 'Integração com o Portal da Transparência',
        descricao: 'Planejada a integração automática de dados públicos com o Portal da Transparência do município.',
        impacto: 'Aumenta a visibilidade dos gastos públicos para a população.',
        visivel: true,
      },
    ],
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
    id: 'edicao-2026-08-09',
    titulo: 'Especial: Dia dos Pais',
    resumo:
      'Uma homenagem aos pais que também são cidadãos, servidores públicos e usuários do Conecta Cidades todos os dias.',
    tipo: 'especial',
    periodo: { tipo: 'especial', tema: 'Dia dos Pais' },
    status: 'publico',
    criadoEm: '2026-08-09',
    servicoDestaque: {
      titulo: 'Feliz Dia dos Pais!',
      descricao:
        'Para celebrar a data, destacamos as funcionalidades que ajudam famílias a organizar o dia a dia com o poder público de forma mais leve e prática.',
      imagemUrl: 'https://picsum.photos/seed/ccnews-paisfilho/900/650',
      imagemPosicao: 'centro',
      cor: 'laranja',
    },
    atualizacoes: [
      {
        id: 'atualizacao-11',
        categoria: 'novidades',
        icone: 'bi-person-check',
        titulo: 'Agendamento em família',
        descricao: 'Agora é possível agendar atendimentos para mais de um membro da família em um único horário.',
        impacto: 'Facilita a vida de pais que cuidam da agenda de toda a casa.',
        midia: { tipo: 'imagem', url: 'https://picsum.photos/seed/ccnews-familia/900/650' },
        visivel: true,
      },
      {
        id: 'atualizacao-12',
        categoria: 'proximos-passos',
        icone: 'bi-calendar-check',
        titulo: 'Ampliação do horário de atendimento aos sábados',
        descricao: 'Em estudo a extensão do horário de atendimento presencial para os sábados pela manhã.',
        impacto: 'Facilita o acesso de quem trabalha durante a semana.',
        visivel: true,
      },
    ],
  },
  {
    id: 'edicao-2026-08-01',
    titulo: 'Resumo de Agosto',
    resumo: 'Panorama das principais entregas do mês, com destaque para os novos painéis de indicadores.',
    tipo: 'mensal',
    periodo: { tipo: 'mensal', mes: 8, ano: 2026 },
    status: 'publico',
    criadoEm: '2026-08-10',
    atualizacoes: [
      {
        id: 'atualizacao-13',
        categoria: 'novidades',
        icone: 'bi-graph-up-arrow',
        titulo: 'Painel de indicadores por secretaria',
        descricao: 'Cada secretaria agora tem um painel próprio com indicadores de atendimento em tempo real.',
        impacto: 'Facilita o acompanhamento de metas por gestores setoriais.',
        midia: { tipo: 'imagem', url: 'https://picsum.photos/seed/ccnews-indicadores/900/650' },
        visivel: true,
      },
      {
        id: 'atualizacao-14',
        categoria: 'melhorias',
        icone: 'bi-file-earmark-text',
        titulo: 'Nova busca por CPF/CNPJ nos processos',
        descricao: 'A busca de processos administrativos agora aceita CPF e CNPJ além do número do protocolo.',
        impacto: 'Agiliza a localização de processos pelos atendentes.',
        visivel: true,
      },
    ],
  },
  {
    id: 'edicao-2026-07-21',
    titulo: 'Atualizações da Semana',
    resumo: 'Aprimoramentos nos fluxos de atendimento.',
    tipo: 'semanal',
    periodo: { tipo: 'semanal', dataInicio: '2026-07-21', dataFim: '2026-07-24' },
    status: 'publico',
    criadoEm: '2026-07-24',
    atualizacoes: [
      {
        id: 'atualizacao-15',
        categoria: 'novidades',
        icone: 'bi-geo-alt',
        titulo: 'Mapa de pontos de atendimento',
        descricao: 'Novo mapa interativo com todos os pontos de atendimento presencial da prefeitura.',
        impacto: 'Ajuda o cidadão a encontrar a unidade mais próxima.',
        midia: { tipo: 'imagem', url: 'https://picsum.photos/seed/ccnews-pontos/900/650' },
        visivel: true,
      },
    ],
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
      // Se o mock mudou de versão desde a última visita, o conteúdo novo do
      // código prevalece sobre o que estava salvo (senão nunca apareceria).
      // Do contrário, respeita o que já está salvo (inclusive CRUD feito no admin).
      if (this.lerVersaoSalva() !== VERSAO_MOCK_ATUAL) {
        this._edicoes.set(EDICOES_MOCK);
        this.salvarVersao(VERSAO_MOCK_ATUAL);
      } else {
        this._edicoes.set(this.carregarDoArmazenamento() ?? EDICOES_MOCK);
      }
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

  private lerVersaoSalva(): string | null {
    try {
      return localStorage.getItem(CHAVE_VERSAO_MOCK);
    } catch {
      return null;
    }
  }

  private salvarVersao(versao: string): void {
    try {
      localStorage.setItem(CHAVE_VERSAO_MOCK, versao);
    } catch {
      // localStorage indisponível — segue só em memória, sem persistir a versão.
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
