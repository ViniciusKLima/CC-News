export type TipoEdicao = 'semanal' | 'mensal' | 'anual' | 'especial';

export type StatusEdicao = 'publico' | 'arquivado';

export type CategoriaAtualizacao = 'novidades' | 'melhorias' | 'correcoes' | 'testes' | 'proximos-passos';

export interface PeriodoSemanal {
  tipo: 'semanal';
  dataInicio: string;
  dataFim: string;
}

export interface PeriodoMensal {
  tipo: 'mensal';
  mes: number;
  ano: number;
}

export interface PeriodoAnual {
  tipo: 'anual';
  ano: number;
}

export interface PeriodoEspecial {
  tipo: 'especial';
  tema: string;
}

export type PeriodoEdicao = PeriodoSemanal | PeriodoMensal | PeriodoAnual | PeriodoEspecial;

export interface MidiaAtualizacao {
  tipo: 'imagem' | 'video';
  url: string;
}

export interface Atualizacao {
  id: string;
  categoria: CategoriaAtualizacao;
  icone: string;
  titulo: string;
  descricao: string;
  impacto: string;
  midia?: MidiaAtualizacao;
  visivel: boolean;
}

export interface Edicao {
  id: string;
  capaUrl?: string;
  titulo: string;
  resumo: string;
  tipo: TipoEdicao;
  periodo: PeriodoEdicao;
  status: StatusEdicao;
  /** Data de criação/publicação (ISO), usada para agrupamento cronológico e ordenação. */
  criadoEm: string;
  atualizacoes: Atualizacao[];
}

// ---------------------------------------------------------------------------
// Constantes e helpers de apresentação — evitam strings soltas pelo código.
// ---------------------------------------------------------------------------

export const TIPOS_EDICAO: { valor: TipoEdicao; label: string }[] = [
  { valor: 'semanal', label: 'Semanal' },
  { valor: 'mensal', label: 'Mensal' },
  { valor: 'anual', label: 'Anual' },
  { valor: 'especial', label: 'Especial' },
];

export const CATEGORIAS_ATUALIZACAO: { valor: CategoriaAtualizacao; label: string; icone: string; descricao: string }[] = [
  { valor: 'novidades', label: 'Novidades', icone: 'bi-stars', descricao: 'Funcionalidades novas lançadas nesta edição.' },
  { valor: 'melhorias', label: 'Melhorias', icone: 'bi-graph-up-arrow', descricao: 'Ajustes que tornam a plataforma melhor.' },
  { valor: 'correcoes', label: 'Correções', icone: 'bi-tools', descricao: 'Problemas resolvidos nesta edição.' },
  { valor: 'testes', label: 'Em fase de testes', icone: 'bi-flask', descricao: 'Funcionalidades sendo validadas antes de produção.' },
  { valor: 'proximos-passos', label: 'Próximos passos', icone: 'bi-signpost-2', descricao: 'O que vem a seguir na plataforma.' },
];

export const MESES_NOMES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

export function labelCategoria(categoria: CategoriaAtualizacao): string {
  return CATEGORIAS_ATUALIZACAO.find((item) => item.valor === categoria)?.label ?? categoria;
}

export function labelTipo(tipo: TipoEdicao): string {
  return TIPOS_EDICAO.find((item) => item.valor === tipo)?.label ?? tipo;
}

/** Formata o período de uma edição em texto legível, de acordo com o tipo. */
export function formatarPeriodo(periodo: PeriodoEdicao): string {
  switch (periodo.tipo) {
    case 'semanal': {
      const inicio = formatarDataCurta(periodo.dataInicio);
      const fim = formatarDataCurta(periodo.dataFim);
      return inicio && fim ? `${inicio} a ${fim}` : 'Período não definido';
    }
    case 'mensal':
      return periodo.mes && periodo.ano ? `${MESES_NOMES[periodo.mes - 1]} de ${periodo.ano}` : 'Período não definido';
    case 'anual':
      return periodo.ano ? `Ano de ${periodo.ano}` : 'Período não definido';
    case 'especial':
      return periodo.tema || 'Tema não definido';
  }
}

function formatarDataCurta(iso: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return '';
  return `${String(dia).padStart(2, '0')} de ${MESES_NOMES[mes - 1]}`;
}
