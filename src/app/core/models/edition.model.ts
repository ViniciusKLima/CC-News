// Tipos e interfaces do domínio de edições: uma edição agrupa um conjunto
// de atualizações (novidades, melhorias, correções etc.) publicadas em um
// determinado período (semanal, mensal, anual ou especial).

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

/** Para imagem, url é o link do Cloudinary. Para vídeo, é o link do YouTube colado pelo editor (ver youtube.util para extrair o id). */
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

export type CorAcento = 'azul' | 'roxo' | 'verde' | 'laranja' | 'rosa';

/** Controla qual parte da imagem fica visível dentro do container (que permanece sempre à esquerda do card). */
export type PosicaoImagemDestaque = 'esquerda' | 'centro' | 'direita';

/** Bloco opcional de destaque exibido no topo da edição pública. */
export interface ServicoDestaque {
  titulo: string;
  descricao: string;
  imagemUrl?: string;
  imagemPosicao?: PosicaoImagemDestaque;
  /** Cor de fundo do card, em hexadecimal, escolhida livremente pelo admin (mesmo mecanismo da cor sólida da capa). */
  cor: string;
}

/** Azul marinho padrão da plataforma, sugerido em todo campo de cor sólida (capa da edição, serviço em destaque). */
export const COR_PADRAO_PLATAFORMA = '#102f55';

export interface Edicao {
  id: string;
  /** URL personalizada opcional (ex.: "atualizacoes-agosto"), usada no lugar do id na rota pública /edicao/:id. */
  slug?: string;
  /** Capa da edição: imagem (capaUrl) ou cor sólida (capaCor, hexadecimal), nunca as duas ao mesmo tempo. */
  capaUrl?: string;
  capaCor?: string;
  titulo: string;
  resumo: string;
  tipo: TipoEdicao;
  periodo: PeriodoEdicao;
  status: StatusEdicao;
  /** Data de criação/publicação (ISO), usada para agrupamento cronológico e ordenação. */
  criadoEm: string;
  atualizacoes: Atualizacao[];
  servicoDestaque?: ServicoDestaque;
  /** Texto livre opcional exibido na edição pública, para publicações mais simples que não precisam de atualizações categorizadas. */
  textoLivre?: string;
  // As três seções abaixo são opcionais e, por padrão (campo ausente), ficam
  // ligadas, para não afetar edições já publicadas antes desse campo existir.
  mostrarAtualizacoes?: boolean;
  mostrarResumo?: boolean;
  mostrarProximosPassos?: boolean;
}

// ---------------------------------------------------------------------------
// Constantes e helpers de apresentação, usados para não espalhar strings
// e formatações soltas pelas telas que consomem esses dados.
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

export const POSICOES_IMAGEM_DESTAQUE: { valor: PosicaoImagemDestaque; label: string }[] = [
  { valor: 'esquerda', label: 'Esquerda' },
  { valor: 'centro', label: 'Centro' },
  { valor: 'direita', label: 'Direita' },
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

// Cor de acento de cada categoria, usada no ícone e no selo colorido do
// card de atualização (tanto no admin quanto na edição pública).
const CORES_CATEGORIA: Record<CategoriaAtualizacao, CorAcento> = {
  novidades: 'roxo',
  melhorias: 'verde',
  correcoes: 'laranja',
  testes: 'azul',
  'proximos-passos': 'rosa',
};

export function corCategoriaAtualizacao(categoria: CategoriaAtualizacao): CorAcento {
  return CORES_CATEGORIA[categoria];
}

/** Normaliza um texto livre em slug de URL (minusculas, sem acento, hifens no lugar de espacos). */
export function sanitizarSlug(valor: string): string {
  const semAcentos = Array.from(valor.normalize('NFKD'))
    .filter((caractere) => caractere.codePointAt(0)! < 128)
    .join('');

  return semAcentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
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

// Mês/ano usados para agrupar a edição no histórico (dashboard do admin e
// home pública). Semanal usa o início do período informado; mensal usa o
// próprio mês/ano escolhido; anual e especial não têm um mês próprio, então
// usam a data de criação da edição.
export function anoAgrupamento(edicao: Edicao): number {
  const periodo = edicao.periodo;
  if (periodo.tipo === 'mensal') return periodo.ano;
  if (periodo.tipo === 'semanal') {
    return Number(periodo.dataInicio.slice(0, 4)) || Number(edicao.criadoEm.slice(0, 4));
  }
  return Number(edicao.criadoEm.slice(0, 4));
}

export function mesAgrupamento(edicao: Edicao): number {
  const periodo = edicao.periodo;
  if (periodo.tipo === 'mensal') return periodo.mes;
  if (periodo.tipo === 'semanal') {
    return Number(periodo.dataInicio.slice(5, 7)) || Number(edicao.criadoEm.slice(5, 7));
  }
  return Number(edicao.criadoEm.slice(5, 7));
}

function formatarDataCurta(iso: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-').map(Number);
  if (!ano || !mes || !dia) return '';
  return `${String(dia).padStart(2, '0')} de ${MESES_NOMES[mes - 1]}`;
}
