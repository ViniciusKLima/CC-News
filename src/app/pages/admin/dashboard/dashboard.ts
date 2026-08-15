import { Component, HostListener, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Edicao, EdicaoTipo } from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';

const MESES_NOMES = [
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

const TIPO_SLUGS: Record<EdicaoTipo, string> = {
  Semanal: 'semanal',
  Especial: 'especial',
  Mensal: 'mensal',
  Diária: 'diaria',
};

const TIPO_ICONES: Record<EdicaoTipo, string> = {
  Semanal: 'bi-graph-up-arrow',
  Especial: 'bi-stars',
  Mensal: 'bi-calendar3',
  Diária: 'bi-lightning-charge',
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

  readonly edicoes = this.editionService.edicoes;
  readonly loading = this.editionService.loading;

  readonly skeletonGrupos = Array.from({ length: 2 });
  readonly skeletonLinhas = Array.from({ length: 3 });

  termoBusca = signal('');
  filtroMes = signal('');
  filtroAno = signal('');
  gruposAbertos = signal<Set<string>>(new Set());
  menuAbertoId = signal<string | null>(null);

  private primeiroGrupoJaAberto = false;

  readonly anosDisponiveis = computed(() => {
    const anos = new Set(this.edicoes().map((edicao) => edicao.ano));
    return Array.from(anos).sort((a, b) => b - a);
  });

  readonly mesesDisponiveis = computed(() => {
    const indices = new Set(this.edicoes().map((edicao) => edicao.mes));
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
      if (mes && edicao.mes !== Number(mes)) return false;
      if (ano && edicao.ano !== Number(ano)) return false;
      if (!termo) return true;

      return (
        edicao.titulo.toLowerCase().includes(termo) ||
        edicao.subtitulo.toLowerCase().includes(termo) ||
        edicao.periodo.toLowerCase().includes(termo)
      );
    });
  });

  // Os grupos e a contagem por mês são derivados das edições filtradas —
  // nunca armazenados manualmente, evitando divergência entre a contagem
  // exibida e a lista real de edições.
  readonly gruposMensais = computed<GrupoMensal[]>(() => {
    const mapa = new Map<string, GrupoMensal>();

    for (const edicao of this.edicoesFiltradas()) {
      const chave = `${edicao.ano}-${String(edicao.mes).padStart(2, '0')}`;
      let grupo = mapa.get(chave);
      if (!grupo) {
        grupo = { chave, nome: `${MESES_NOMES[edicao.mes - 1]} de ${edicao.ano}`, edicoes: [] };
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
    this.editionService.alternarStatus(edicao.id);
    this.fecharMenu();
  }

  excluir(edicao: Edicao): void {
    this.fecharMenu();
    const confirmado = window.confirm(
      `Tem certeza que deseja excluir a edição "${edicao.titulo}" (${edicao.periodo})? Essa ação não pode ser desfeita.`,
    );
    if (confirmado) {
      this.editionService.remover(edicao.id);
    }
  }

  tipoSlug(tipo: EdicaoTipo): string {
    return TIPO_SLUGS[tipo];
  }

  iconeTipo(tipo: EdicaoTipo): string {
    return TIPO_ICONES[tipo];
  }
}
