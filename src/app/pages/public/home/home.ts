import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  Injector,
  QueryList,
  ViewChildren,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Header } from '../../../shared/components/header/header';
import { Footer } from '../../../shared/components/footer/footer';
import { Edicao, MESES_NOMES, formatarPeriodo, labelTipo } from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';

interface GrupoMensal {
  id: string;
  nome: string;
  edicoes: Edicao[];
}

// Página inicial: hero, busca/filtros e o histórico de edições publicadas
// agrupado por mês, exibido em carrosséis horizontais.
@Component({
  selector: 'app-home',
  imports: [Header, Footer, RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class Home implements AfterViewInit {
  private readonly injector = inject(Injector);
  private readonly editionService = inject(EditionService);

  readonly loading = this.editionService.loading;
  mostrarVoltarTopo = signal(false);

  // Estado dos filtros de busca (texto, ano, mês e categoria)
  termoBusca = signal('');
  filtroAno = signal('');
  filtroMes = signal('');
  filtroCategoria = signal('');

  readonly skeletonMeses = Array.from({ length: 2 });
  readonly skeletonCards = Array.from({ length: 3 });

  protected readonly formatarPeriodo = formatarPeriodo;
  protected readonly labelTipo = labelTipo;

  // A área pública só mostra edições com status "publico". As arquivadas
  // continuam existindo no service, mas não devem aparecer aqui.
  readonly edicoesPublicas = computed(() => this.editionService.edicoes().filter((edicao) => edicao.status === 'publico'));

  readonly anosDisponiveis = computed(() => {
    const anos = new Set(this.edicoesPublicas().map((edicao) => this.anoDe(edicao)));
    return Array.from(anos).sort((a, b) => b - a);
  });

  readonly mesesDisponiveis = computed(() => {
    const indices = new Set(this.edicoesPublicas().map((edicao) => this.mesDe(edicao)));
    return Array.from(indices)
      .sort((a, b) => a - b)
      .map((mes) => ({ valor: String(mes).padStart(2, '0'), nome: MESES_NOMES[mes - 1] }));
  });

  readonly categoriasDisponiveis = computed(() => {
    const tipos = new Set(this.edicoesPublicas().map((edicao) => edicao.tipo));
    return Array.from(tipos).sort();
  });

  readonly temFiltrosAtivos = computed(
    () => !!this.termoBusca() || !!this.filtroAno() || !!this.filtroMes() || !!this.filtroCategoria(),
  );

  // Aplica os filtros ativos e agrupa o resultado por mês/ano, na ordem
  // em que os grupos aparecem na tela (mais recente primeiro).
  readonly edicoesFiltradas = computed<GrupoMensal[]>(() => {
    const termo = this.termoBusca().trim().toLowerCase();
    const ano = this.filtroAno();
    const mesFiltro = this.filtroMes();
    const categoria = this.filtroCategoria();

    const filtradas = this.edicoesPublicas().filter((edicao) => {
      if (ano && String(this.anoDe(edicao)) !== ano) return false;
      if (mesFiltro && String(this.mesDe(edicao)).padStart(2, '0') !== mesFiltro) return false;
      if (categoria && edicao.tipo !== categoria) return false;
      if (!termo) return true;

      return (
        edicao.titulo.toLowerCase().includes(termo) ||
        edicao.resumo.toLowerCase().includes(termo) ||
        formatarPeriodo(edicao.periodo).toLowerCase().includes(termo)
      );
    });

    const mapa = new Map<string, GrupoMensal>();
    for (const edicao of filtradas) {
      const ano2 = this.anoDe(edicao);
      const mes2 = this.mesDe(edicao);
      const id = `${ano2}-${String(mes2).padStart(2, '0')}`;
      let grupo = mapa.get(id);
      if (!grupo) {
        grupo = { id, nome: `${MESES_NOMES[mes2 - 1]} de ${ano2}`, edicoes: [] };
        mapa.set(id, grupo);
      }
      grupo.edicoes.push(edicao);
    }

    return Array.from(mapa.values()).sort((a, b) => b.id.localeCompare(a.id));
  });

  // A partir daqui: controle dos carrosséis horizontais de cada mês
  // (botões de anterior/próximo, estado habilitado/desabilitado das setas).
  @ViewChildren('slide') private slides!: QueryList<ElementRef<HTMLElement>>;
  private resizeRafId?: number;

  ngAfterViewInit(): void {
    this.updateAllNavStates();

    // Recalcula o estado dos botões sempre que a lista de edições exibidas mudar
    // (carregamento inicial, busca ou filtros). Sem isso, o botão pode ficar
    // com um estado desatualizado em relação à quantidade real de cards.
    effect(
      () => {
        this.edicoesFiltradas();
        setTimeout(() => this.updateAllNavStates());
      },
      { injector: this.injector },
    );
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    // Coalesce múltiplos eventos de resize em um único recálculo por frame.
    if (this.resizeRafId) cancelAnimationFrame(this.resizeRafId);
    this.resizeRafId = requestAnimationFrame(() => this.updateAllNavStates());
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.mostrarVoltarTopo.set(window.scrollY > 400);
  }

  voltarAoTopo(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  limparFiltros(): void {
    this.termoBusca.set('');
    this.filtroAno.set('');
    this.filtroMes.set('');
    this.filtroCategoria.set('');
  }

  contarNovidades(edicao: Edicao): number {
    return edicao.atualizacoes.filter((atualizacao) => atualizacao.visivel).length;
  }

  scrollSlide(container: HTMLElement, direction: number): void {
    const card = container.querySelector<HTMLElement>('.card-edicao');
    if (!card) return;

    const gap = parseFloat(getComputedStyle(container).columnGap) || 0;
    const step = card.getBoundingClientRect().width + gap;
    container.scrollBy({ left: direction * step, behavior: 'smooth' });
  }

  updateNavState(container: HTMLElement): void {
    const wrapper = container.closest<HTMLElement>('.slide-wrapper');
    if (!wrapper) return;

    const prevBtn = wrapper.querySelector<HTMLButtonElement>('.slide-nav.prev');
    const nextBtn = wrapper.querySelector<HTMLButtonElement>('.slide-nav.next');
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);

    if (prevBtn) prevBtn.disabled = container.scrollLeft <= 1;
    if (nextBtn) nextBtn.disabled = container.scrollLeft >= maxScroll - 1;
  }

  private updateAllNavStates(): void {
    this.slides?.forEach((ref) => this.updateNavState(ref.nativeElement));
  }

  // Deduz ano/mês da edição a partir do período, com fallback para a data
  // de criação quando o tipo de período não define esses campos (semanal
  // e especial não têm mês/ano próprios).
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
