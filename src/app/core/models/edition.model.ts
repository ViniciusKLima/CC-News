export type EdicaoTipo = 'Diária' | 'Semanal' | 'Mensal' | 'Especial';

export type EdicaoStatus = 'publicada' | 'rascunho';

export interface Edicao {
  id: string;
  titulo: string;
  subtitulo: string;
  periodo: string;
  tipo: EdicaoTipo;
  status: EdicaoStatus;
  totalNovidades: number;
  /** Mês da edição (1 a 12), usado para agrupamento e filtros. */
  mes: number;
  ano: number;
  /** URL da capa (retrato). Quando ausente, a interface exibe um placeholder ilustrativo. */
  capaUrl?: string;
}
