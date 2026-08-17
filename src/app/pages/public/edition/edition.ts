import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import {
  Atualizacao,
  CATEGORIAS_ATUALIZACAO,
  CategoriaAtualizacao,
  CorAcento,
  Edicao,
  formatarPeriodo,
  labelCategoria,
  labelTipo,
} from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';

export type FiltroCategoria = 'todos' | CategoriaAtualizacao;

export interface ResumoStat {
  label: string;
  valor: number;
  icone: string;
  cor: CorAcento;
}

const CORES_CATEGORIA: Record<CategoriaAtualizacao, CorAcento> = {
  novidades: 'roxo',
  melhorias: 'verde',
  correcoes: 'laranja',
  testes: 'azul',
  'proximos-passos': 'rosa',
};

@Component({
  selector: 'app-edition',
  imports: [Header, Footer, RouterLink],
  templateUrl: './edition.html',
  styleUrl: './edition.scss',
})
export class Edition {
  private readonly route = inject(ActivatedRoute);
  private readonly editionService = inject(EditionService);

  readonly loading = this.editionService.loading;

  readonly edicao = computed<Edicao | undefined>(() => {
    const id = this.route.snapshot.paramMap.get('id');
    return id ? this.editionService.obterPorId(id) : undefined;
  });

  // Edições arquivadas não devem ficar acessíveis na área pública, mesmo por link direto.
  readonly edicaoNaoEncontrada = computed(() => {
    if (this.loading()) return false;
    const edicao = this.edicao();
    return !edicao || edicao.status !== 'publico';
  });

  filtro = signal<FiltroCategoria>('todos');

  protected readonly formatarPeriodo = formatarPeriodo;
  protected readonly labelTipo = labelTipo;
  protected readonly labelCategoria = labelCategoria;

  readonly abas: { valor: FiltroCategoria; label: string }[] = [
    { valor: 'todos', label: 'Todos' },
    ...CATEGORIAS_ATUALIZACAO.map((categoria) => ({ valor: categoria.valor as FiltroCategoria, label: categoria.label })),
  ];

  readonly skeletonItens = Array.from({ length: 6 });
  readonly skeletonPassos = Array.from({ length: 4 });
  readonly skeletonStats = Array.from({ length: 6 });

  // A área pública só enxerga atualizações marcadas como visíveis — as
  // ocultas continuam existindo na edição, só não aparecem para o usuário.
  readonly atualizacoesVisiveis = computed<Atualizacao[]>(
    () => this.edicao()?.atualizacoes.filter((atualizacao) => atualizacao.visivel) ?? [],
  );

  readonly itensFiltrados = computed(() => {
    const filtro = this.filtro();
    const todas = this.atualizacoesVisiveis();
    return filtro === 'todos' ? todas : todas.filter((item) => item.categoria === filtro);
  });

  readonly proximosPassos = computed(() =>
    this.atualizacoesVisiveis()
      .filter((item) => item.categoria === 'proximos-passos')
      .slice(0, 5),
  );

  readonly resumoStats = computed<ResumoStat[]>(() => {
    const todas = this.atualizacoesVisiveis();
    const stats: ResumoStat[] = [
      { label: 'Atualizações nesta edição', valor: todas.length, icone: 'bi-collection', cor: 'azul' },
    ];

    for (const categoria of CATEGORIAS_ATUALIZACAO) {
      stats.push({
        label: categoria.label,
        valor: todas.filter((item) => item.categoria === categoria.valor).length,
        icone: categoria.icone,
        cor: CORES_CATEGORIA[categoria.valor],
      });
    }

    return stats;
  });

  corCategoria(categoria: CategoriaAtualizacao): CorAcento {
    return CORES_CATEGORIA[categoria];
  }

  selecionarFiltro(valor: FiltroCategoria): void {
    this.filtro.set(valor);
  }

  scrollPara(elemento: HTMLElement): void {
    elemento.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
