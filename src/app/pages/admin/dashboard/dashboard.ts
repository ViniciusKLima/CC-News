import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Edicao, MESES_NOMES, TipoEdicao, formatarPeriodo, labelTipo } from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';
import { ToastService } from '../../../core/services/toast.service';

const TIPO_ICONES: Record<TipoEdicao, string> = {
  semanal: 'bi-graph-up-arrow',
  mensal: 'bi-calendar3',
  anual: 'bi-calendar-range',
  especial: 'bi-stars',
};

interface GrupoMensal {
  chave: string;
  nome: string;
  edicoes: Edicao[];
}

@Component({
  selector: 'app-dashboard',
  imports: [FormsModule, RouterLink, RouterLinkActive],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard {
  private readonly editionService = inject(EditionService);
  private readonly toastService = inject(ToastService);

  readonly edicoes = this.editionService.edicoes;
  readonly loading = this.editionService.loading;

  readonly skeletonGrupos = Array.from({ length: 2 });
  readonly skeletonLinhas = Array.from({ length: 3 });

  protected readonly formatarPeriodo = formatarPeriodo;
  protected readonly labelTipo = labelTipo;

  termoBusca = signal('');
  filtroMes = signal('');
  filtroAno = signal('');
  gruposAbertos = signal<Set<string>>(new Set());
  menuAbertoId = signal<string | null>(null);

  private primeiroGrupoJaAberto = false;

  readonly anosDisponiveis = computed(() => {
    const anos = new Set(this.edicoes().map((edicao) => this.anoDe(edicao)));
    return Array.from(anos).sort((a, b) => b - a);
  });

  readonly mesesDisponiveis = computed(() => {
    const indices = new Set(this.edicoes().map((edicao) => this.mesDe(edicao)));
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((mes) => ({ valor: mes, nome: MESES_NOMES[mes - 1] }));
  });

  readonly temFiltrosAtivos = computed(
    () => !!this.termoBusca() || !!this.filtroMes() || !!this.filtroAno(),
  );

  readonly edicoesFiltradas = computed(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    const mes = this.filtroMes();
    const ano = this.filtroAno();

    return this.edicoes().filter((edicao) => {
      if (mes && this.mesDe(edicao) !== Number(mes)) return false;
      if (ano && this.anoDe(edicao) !== Number(ano)) return false;
      if (!termo) return true;

      return (
        edicao.titulo.toLowerCase().includes(termo) ||
        edicao.resumo.toLowerCase().includes(termo) ||
        formatarPeriodo(edicao.periodo).toLowerCase().includes(termo)
      );
    });
  });

  // Os grupos e a contagem por mês são derivados das edições filtradas —
  // nunca armazenados manualmente, evitando divergência entre a contagem
  // exibida e a lista real de edições.
  readonly gruposMensais = computed<GrupoMensal[]>(() => {
    const mapa = new Map<string, GrupoMensal>();

    for (const edicao of this.edicoesFiltradas()) {
      const ano = this.anoDe(edicao);
      const mes = this.mesDe(edicao);
      const chave = `${ano}-${String(mes).padStart(2, '0')}`;
      let grupo = mapa.get(chave);
      if (!grupo) {
        grupo = { chave, nome: `${MESES_NOMES[mes - 1]} de ${ano}`, edicoes: [] };
        mapa.set(chave, grupo);
      }
      grupo.edicoes.push(edicao);
    }

    return Array.from(mapa.values()).sort((a, b) => b.chave.localeCompare(a.chave));
  });

  constructor() {
    // Abre o mês mais recente automaticamente assim que os dados chegam,
    // sem reabrir sempre que o usuário filtrar ou pesquisar depois.
    effect(() => {
      const grupos = this.gruposMensais();
      if (!this.primeiroGrupoJaAberto && grupos.length > 0) {
        this.primeiroGrupoJaAberto = true;
        this.gruposAbertos.set(new Set([grupos[0].chave]));
      }
    });
  }

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroMes.set('');
    this.filtroAno.set('');
  }

  grupoEstaAberto(chave: string): boolean {
    return this.gruposAbertos().has(chave);
  }

  alternarGrupo(chave: string): void {
    this.gruposAbertos.update((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) {
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  }

  alternarMenu(id: string, evento: Event): void {
    evento.stopPropagation();
    this.menuAbertoId.set(this.menuAbertoId() === id ? null : id);
  }

  fecharMenu(): void {
    this.menuAbertoId.set(null);
  }

  @HostListener('document:click')
  onCliqueForaDoMenu(): void {
    this.fecharMenu();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fecharMenu();
  }

  alternarStatus(edicao: Edicao): void {
    const novoStatus = edicao.status === 'publico' ? 'arquivado' : 'publico';
    this.editionService.atualizarStatus(edicao.id, novoStatus);
    this.fecharMenu();
    this.toastService.sucesso(
      novoStatus === 'publico' ? 'Edição publicada com sucesso.' : 'Edição arquivada com sucesso.',
    );
  }

  excluir(edicao: Edicao): void {
    this.fecharMenu();
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir a edição "${edicao.titulo}" (${formatarPeriodo(edicao.periodo)})? Essa ação não pode ser desfeita.`,
    );
    if (confirmado) {
      this.editionService.remover(edicao.id);
      this.toastService.sucesso('Edição excluída com sucesso.');
    }
  }

  iconeTipo(tipo: TipoEdicao): string {
    return TIPO_ICONES[tipo];
  }

  private anoDe(edicao: Edicao): number {
    const periodo = edicao.periodo;
    if (periodo.tipo === 'mensal' || periodo.tipo === 'anual') return periodo.ano;
    return Number(edicao.criadoEm.slice(0, 4));
  }

  private mesDe(edicao: Edicao): number {
    const periodo = edicao.periodo;
    if (periodo.tipo === 'mensal') return periodo.mes;
    return Number(edicao.criadoEm.slice(5, 7));
  }
}
