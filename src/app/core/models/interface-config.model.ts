// Configuração de aparência da plataforma (logo, banner do hero, cores e
// ícones dos tipos de edição e das categorias de atualização, biblioteca de
// ícones, rodapé e banner de transparência), editável pelo administrador na
// aba Aparência e aplicada em toda a aplicação (pública e administrativa).
// Guardada num único documento no Firestore (ver InterfaceConfigService).

import { CategoriaAtualizacao, TipoEdicao } from './edition.model';

export interface CorPar {
  fundo: string;
  texto: string;
}

export type TipoIcone = 'bootstrap' | 'upload';

export interface IconeBiblioteca {
  id: string;
  nome: string;
  tipo: TipoIcone;
  /** Classe do Bootstrap Icons (ex.: "bi-stars") quando tipo é "bootstrap", ou URL do Cloudinary quando tipo é "upload". */
  valor: string;
}

export interface CategoriaAparencia extends CorPar {
  /** Mesmo formato de IconeBiblioteca.valor: classe bi-xxx ou URL. */
  icone: string;
}

export interface TransparenciaBannerConfig {
  icone: string;
  titulo: string;
  descricao: string;
  textoBotao: string;
  linkBotao: string;
}

export interface InterfaceConfig {
  logoUrl: string;
  /** Logo exibida no menu lateral do admin (fundo escuro) — separada da logo pública porque geralmente é uma variante só-branca. */
  logoAdminUrl: string;
  heroBannerUrl: string;
  /** Até 3 banners usados antes do atual, mais recente primeiro, pra poder voltar pra um deles sem precisar reenviar. */
  heroBannerHistorico: string[];
  /**
   * Em telas estreitas o hero encolhe bem mais na largura do que na altura,
   * cortando boa parte da imagem dos lados — este número (0 a 100, "0%" é a
   * borda esquerda da foto e "100%" a direita) escolhe qual ponto horizontal
   * fica centralizado no recorte visível. No desktop a posição continua fixa
   * (direita), já pensada pro banner recomendado.
   */
  heroBannerFocoMobileX: number;
  heroTituloKicker: string;
  heroTitulo: string;
  heroTexto: string;
  footerTitulo: string;
  footerTexto: string;
  tipos: Record<TipoEdicao, CorPar>;
  categorias: Record<CategoriaAtualizacao, CategoriaAparencia>;
  icones: IconeBiblioteca[];
  transparencia: TransparenciaBannerConfig;
}

/** Retorna true quando o valor de um ícone é uma imagem enviada (URL), em vez de uma classe do Bootstrap Icons. */
export function iconeEhImagem(valor: string): boolean {
  return /^https?:\/\//.test(valor);
}

const ICONES_BOOTSTRAP_PADRAO: string[] = [
  // Gerais
  'bi-stars',
  'bi-graph-up-arrow',
  'bi-tools',
  'bi-flask',
  'bi-signpost-2',
  'bi-shield-lock',
  'bi-envelope',
  'bi-image',
  'bi-map',
  'bi-person-check',
  'bi-bell',
  'bi-printer',
  'bi-geo-alt',
  'bi-wallet2',
  'bi-diagram-3',
  'bi-tags',
  'bi-calendar-check',
  'bi-lightning-charge',
  'bi-gear',
  'bi-file-earmark-text',
  // Órgão público
  'bi-bank',
  'bi-building',
  'bi-buildings',
  'bi-flag',
  'bi-patch-check',
  // Formulários
  'bi-clipboard-check',
  'bi-ui-checks',
  'bi-input-cursor-text',
  'bi-list-check',
  'bi-card-checklist',
  // Endereço
  'bi-signpost',
  'bi-house-door',
  'bi-pin-map',
  'bi-compass',
  'bi-truck',
  // Tecnologia
  'bi-cpu',
  'bi-code-slash',
  'bi-wifi',
  'bi-phone',
  'bi-laptop',
  'bi-cloud',
  'bi-robot',
  'bi-database',
  'bi-qr-code',
  'bi-hdd-network',
  // Avaliação e engajamento
  'bi-star',
  'bi-star-fill',
  'bi-hand-thumbs-up',
  'bi-heart',
  'bi-trophy',
  'bi-award',
  'bi-emoji-smile',
  'bi-megaphone',
  'bi-chat-dots',
  'bi-people',
  // Segurança e acesso
  'bi-lock',
  'bi-unlock',
  'bi-fingerprint',
  'bi-universal-access',
  // Financeiro
  'bi-cash-coin',
  'bi-credit-card',
  'bi-piggy-bank',
  'bi-receipt',
  // Dados e indicadores
  'bi-bar-chart',
  'bi-pie-chart',
  'bi-clipboard-data',
  // Diversos
  'bi-rocket-takeoff',
  'bi-puzzle',
  'bi-magic',
  'bi-translate',
  'bi-globe',
  'bi-arrow-repeat',
  'bi-clock-history',
  'bi-exclamation-triangle',
  'bi-check-circle',
  'bi-shield-check',
];

/** Config padrão: reflete exatamente os valores hardcoded existentes na aplicação, para não mudar nada visualmente antes de o admin editar algo. */
export const INTERFACE_CONFIG_PADRAO: InterfaceConfig = {
  logoUrl: '/LogoConectaNews.svg',
  logoAdminUrl: '/LogoConectaNewsADM-White.svg',
  heroBannerUrl: '/banner-hero.png',
  heroBannerHistorico: [],
  heroBannerFocoMobileX: 50,
  heroTituloKicker: 'CONECTA CIDADES',
  heroTitulo: 'NEWS',
  heroTexto:
    'O canal oficial de atualizações da Conecta Cidades. Acompanhe novidades, melhorias, correções e o que vem a seguir na plataforma, edição após edição.',
  footerTitulo: 'Conecta Cidades — Tecnologia para aproximar prefeituras e cidadãos.',
  footerTexto: '© 2026 Conecta Cidades. Todos os direitos reservados.',
  tipos: {
    semanal: { fundo: '#6d28d9', texto: '#ffffff' },
    mensal: { fundo: '#1369f5', texto: '#f2f6fd' },
    anual: { fundo: '#16a34a', texto: '#e4ffe3' },
    especial: { fundo: '#e6a210', texto: '#ffffff' },
  },
  categorias: {
    novidades: { icone: 'bi-stars', fundo: '#e8caff', texto: '#5969eb' },
    melhorias: { icone: 'bi-graph-up-arrow', fundo: '#e4ffe3', texto: '#16a34a' },
    correcoes: { icone: 'bi-tools', fundo: '#fff1c4', texto: '#d97706' },
    testes: { icone: 'bi-flask', fundo: '#f2f6fd', texto: '#1369f5' },
    'proximos-passos': { icone: 'bi-signpost-2', fundo: '#ffe4f0', texto: '#d6336c' },
  },
  icones: ICONES_BOOTSTRAP_PADRAO.map((valor) => ({
    id: valor,
    nome: valor.replace(/^bi-/, '').replace(/-/g, ' '),
    tipo: 'bootstrap',
    valor,
  })),
  transparencia: {
    icone: 'bi-shield-check',
    titulo: 'Transparência que gera confiança',
    descricao:
      'Aqui você acompanha, de forma clara e aberta, tudo o que estamos desenvolvendo, testando e buscando transformar a gestão pública.',
    textoBotao: 'Sobre o CC News',
    linkBotao: '/',
  },
};
