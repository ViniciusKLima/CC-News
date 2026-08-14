import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';

export type StatusItem = 'testes' | 'melhoria' | 'correcao';
export type StatusPasso = 'desenvolvimento' | 'planejado';
export type CorAcento = 'azul' | 'roxo' | 'verde' | 'laranja' | 'rosa';
export type FiltroCategoria = 'todos' | StatusItem;

export interface ItemAtualizacao {
  id: string;
  categoria: 'Testes' | 'Melhorias' | 'Correções';
  status: StatusItem;
  statusLabel: string;
  icone: string;
  titulo: string;
  descricao: string;
  observacao: string;
}

export interface DestaqueEdicao {
  titulo: string;
  descricao: string;
  linkTexto: string;
  linkUrl: string;
  imagemUrl?: string;
  imagemAlt: string;
}

export interface ProximoPasso {
  id: string;
  titulo: string;
  descricao: string;
  status: StatusPasso;
  statusLabel: string;
  cor: CorAcento;
}

export interface Transparencia {
  titulo: string;
  descricao: string;
  linkTexto: string;
  linkUrl: string;
}

export interface EdicaoDetalhe {
  id: string;
  statusEdicao: string;
  resumo: string;
  destaque: DestaqueEdicao;
  itens: ItemAtualizacao[];
  proximosPassos: ProximoPasso[];
  transparencia: Transparencia;
}

export interface ResumoStat {
  label: string;
  valor: number;
  icone: string;
  cor: CorAcento;
}

export const edicaoMock: EdicaoDetalhe = {
  id: 'edicao-2026-08-14',
  statusEdicao: 'Em fase de testes',
  resumo: 'O que nossa equipe está validando antes de colocar em produção.',
  destaque: {
    titulo: 'Wallet digital',
    descricao:
      'Continuidade dos testes da funcionalidade de Wallet para armazenamento de documentos e benefícios digitais.',
    linkTexto: 'Saiba mais',
    linkUrl: '/',
    imagemAlt: 'Mockup da carteira digital Wallet',
  },
  itens: [
    {
      id: 'item-01',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-diagram-3',
      titulo: 'Seleção por departamento',
      descricao: 'Em validação a seleção de serviços e departamentos para atendimento por perfil.',
      observacao: 'Garante maior precisão na organização dos serviços.',
    },
    {
      id: 'item-02',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-shield-lock',
      titulo: 'Restrição de módulos por tags',
      descricao:
        'Em testes a possibilidade de restringir o acesso a módulos utilizados via tags de configuração.',
      observacao: 'Permite maior flexibilidade na gestão de permissões.',
    },
    {
      id: 'item-03',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-briefcase',
      titulo: 'Conecta Trabalho',
      descricao:
        'Continuidade dos testes do módulo Conecta Trabalho, com oportunidades de emprego e qualificação profissional.',
      observacao: 'Amplia o alcance dos serviços voltados ao trabalhador.',
    },
    {
      id: 'item-04',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-tags',
      titulo: 'Padronização de tags',
      descricao: 'Em validação melhorias na padronização e organização das tags utilizadas na plataforma.',
      observacao: 'Facilita filtros, automações e o gerenciamento das informações.',
    },
    {
      id: 'item-05',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-envelope',
      titulo: 'Gerenciamento de e-mails e notificações',
      descricao: 'Em testes melhorias no gerenciamento de e-mails e notificações enviadas pela plataforma.',
      observacao: 'Torna a comunicação mais confiável e organizada.',
    },
    {
      id: 'item-06',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-image',
      titulo: 'Padronização de imagens em WEBP',
      descricao: 'Em testes a padronização de imagens da plataforma para o formato WEBP.',
      observacao: 'Melhora o desempenho no carregamento e reduz o tamanho dos arquivos.',
    },
    {
      id: 'item-07',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-map',
      titulo: 'Camadas adicionais no mapa da cidade',
      descricao: 'Em validação novas camadas informativas disponíveis no mapa público da cidade.',
      observacao: 'Amplia a visualização de dados relevantes para o cidadão.',
    },
    {
      id: 'item-08',
      categoria: 'Testes',
      status: 'testes',
      statusLabel: 'Em testes',
      icone: 'bi-person-check',
      titulo: 'Verificação facilitada de servidores',
      descricao: 'Em testes um novo fluxo para validação de servidores públicos cadastrados na plataforma.',
      observacao: 'Reduz etapas manuais no processo de verificação.',
    },
    {
      id: 'item-09',
      categoria: 'Melhorias',
      status: 'melhoria',
      statusLabel: 'Melhoria',
      icone: 'bi-zoom-in',
      titulo: 'Melhoria no zoom dos mapas do admin',
      descricao: 'Ajuste no comportamento do zoom dos mapas utilizados nas áreas administrativas.',
      observacao: 'Facilita a visualização e o gerenciamento de informações georreferenciadas.',
    },
    {
      id: 'item-10',
      categoria: 'Melhorias',
      status: 'melhoria',
      statusLabel: 'Melhoria',
      icone: 'bi-printer',
      titulo: 'Melhoria na impressão de submissões',
      descricao:
        'Aprimoramentos na edição e impressão dos formulários de submissões realizadas na plataforma.',
      observacao: 'Facilita a geração de registros para arquivamento e entrega ao cidadão.',
    },
    {
      id: 'item-11',
      categoria: 'Correções',
      status: 'correcao',
      statusLabel: 'Correção',
      icone: 'bi-geo-alt',
      titulo: 'Redesign do popup do mapa de cidadão',
      descricao: 'Atualização visual do popup exibido no mapa de cidadão.',
      observacao: 'Torna a navegação mais clara, intuitiva e consistente.',
    },
    {
      id: 'item-12',
      categoria: 'Correções',
      status: 'correcao',
      statusLabel: 'Correção',
      icone: 'bi-bell',
      titulo: 'Correção na notificação de reagendamento',
      descricao: 'Correção no fluxo de notificação enviada após o reagendamento de atendimentos.',
      observacao: 'Melhora a comunicação interna e evita retrabalho nas agendas.',
    },
  ],
  proximosPassos: [
    {
      id: 'passo-01',
      titulo: 'Novas automações de comunicação',
      descricao: 'Expandirá as regras de atendimento para automatizar notificações.',
      status: 'desenvolvimento',
      statusLabel: 'Em desenvolvimento',
      cor: 'roxo',
    },
    {
      id: 'passo-02',
      titulo: 'Relatórios analíticos avançados',
      descricao: 'Mais filtros e visualizações para apoiar a tomada de decisão baseada em dados.',
      status: 'desenvolvimento',
      statusLabel: 'Em desenvolvimento',
      cor: 'azul',
    },
    {
      id: 'passo-03',
      titulo: 'App da cidade',
      descricao: 'Novas funcionalidades de usabilidade e qualidade da aplicação.',
      status: 'planejado',
      statusLabel: 'Planejado',
      cor: 'verde',
    },
    {
      id: 'passo-04',
      titulo: 'Integrações externas',
      descricao: 'Ampliação das integrações com sistemas de terceiros e APIs públicas.',
      status: 'planejado',
      statusLabel: 'Planejado',
      cor: 'laranja',
    },
    {
      id: 'passo-05',
      titulo: 'Acessibilidade',
      descricao: 'Melhorias contínuas para garantir que a plataforma seja cada vez mais inclusiva.',
      status: 'planejado',
      statusLabel: 'Planejado',
      cor: 'rosa',
    },
  ],
  transparencia: {
    titulo: 'Transparência que gera confiança',
    descricao:
      'Aqui você acompanha, de forma clara e aberta, tudo o que estamos desenvolvendo, testando e buscando transformar a gestão pública.',
    linkTexto: 'Sobre o CC News',
    linkUrl: '/',
  },
};

@Component({
  selector: 'app-edition',
  imports: [Header, Footer, RouterLink],
  templateUrl: './edition.html',
  styleUrl: './edition.scss',
})
export class Edition implements OnInit {
  private readonly route = inject(ActivatedRoute);

  loading = signal(true);
  edicao = signal<EdicaoDetalhe | null>(null);
  filtro = signal<FiltroCategoria>('todos');

  readonly abas: { valor: FiltroCategoria; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    { valor: 'testes', label: 'Testes' },
    { valor: 'melhoria', label: 'Melhorias' },
    { valor: 'correcao', label: 'Correções' },
  ];

  readonly skeletonItens = Array.from({ length: 6 });
  readonly skeletonDestaques = Array.from({ length: 5 });
  readonly skeletonPassos = Array.from({ length: 4 });
  readonly skeletonStats = Array.from({ length: 5 });

  readonly itensFiltrados = computed(() => {
    const edicao = this.edicao();
    if (!edicao) return [];

    const filtro = this.filtro();
    return filtro === 'todos' ? edicao.itens : edicao.itens.filter((item) => item.status === filtro);
  });

  readonly outrosDestaques = computed(() => {
    const edicao = this.edicao();
    if (!edicao) return [];

    return edicao.itens.filter((item) => item.status === 'testes').slice(0, 5);
  });

  readonly resumoStats = computed<ResumoStat[]>(() => {
    const edicao = this.edicao();
    if (!edicao) return [];

    const testes = edicao.itens.filter((item) => item.status === 'testes').length;
    const melhorias = edicao.itens.filter((item) => item.status === 'melhoria').length;
    const correcoes = edicao.itens.filter((item) => item.status === 'correcao').length;

    return [
      { label: 'Atualizações nesta edição', valor: edicao.itens.length, icone: 'bi-collection', cor: 'azul' },
      { label: 'Em testes', valor: testes, icone: 'bi-flask', cor: 'roxo' },
      { label: 'Melhorias', valor: melhorias, icone: 'bi-graph-up-arrow', cor: 'verde' },
      { label: 'Correções', valor: correcoes, icone: 'bi-tools', cor: 'laranja' },
      { label: 'Próximos passos', valor: edicao.proximosPassos.length, icone: 'bi-signpost-2', cor: 'rosa' },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') ?? edicaoMock.id;

    // TODO: substituir pelo carregamento real assim que o service de edições existir.
    setTimeout(() => {
      this.edicao.set({ ...edicaoMock, id });
      this.loading.set(false);
    }, 700);
  }

  selecionarFiltro(valor: FiltroCategoria): void {
    this.filtro.set(valor);
  }

  scrollPara(elemento: HTMLElement): void {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
