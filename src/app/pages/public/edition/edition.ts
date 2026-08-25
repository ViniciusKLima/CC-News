import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  QueryList,
  ViewChild,
  ViewChildren,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
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
import { urlImagemOtimizada } from '../../../core/services/cloudinary.service';
import { extrairIdYoutube, urlEmbedYoutube, urlThumbnailYoutube } from '../../../core/utils/youtube.util';

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

// Página pública de uma edição: destaque, atualizações filtráveis por
// categoria, resumo com estatísticas e a lista de próximos passos.
@Component({
  selector: 'app-edition',
  imports: [Header, Footer, RouterLink],
  templateUrl: './edition.html',
  styleUrl: './edition.scss',
})
export class Edition implements AfterViewInit {
  private readonly route = inject(ActivatedRoute);
  private readonly editionService = inject(EditionService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = this.editionService.loading;

  protected readonly urlImagemOtimizada = urlImagemOtimizada;
  protected readonly extrairIdYoutube = extrairIdYoutube;
  protected readonly urlThumbnailYoutube = urlThumbnailYoutube;

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

  // "Próximos passos" já tem uma section dedicada na lateral, mostrá-la
  // também aqui duplicaria os itens. As demais categorias só viram aba
  // quando têm pelo menos um item visível (nada de aba vazia).
  readonly abas = computed<{ valor: FiltroCategoria; label: string }[]>(() => {
    const visiveis = this.atualizacoesVisiveis();
    const categoriasComItens = CATEGORIAS_ATUALIZACAO.filter(
      (categoria) => categoria.valor !== 'proximos-passos' && visiveis.some((item) => item.categoria === categoria.valor),
    );
    return [
      { valor: 'todos' as FiltroCategoria, label: 'Todos' },
      ...categoriasComItens.map((categoria) => ({ valor: categoria.valor as FiltroCategoria, label: categoria.label })),
    ];
  });

  // Posição/largura do indicador azul embaixo da aba ativa, e estado do
  // arrasto horizontal da barra de categorias (ver métodos mais abaixo).
  @ViewChild('tabsScroll') private readonly tabsScrollRef?: ElementRef<HTMLDivElement>;
  @ViewChildren('tabBtn') private readonly tabBtns?: QueryList<ElementRef<HTMLButtonElement>>;

  readonly indicador = signal({ largura: 0, posicao: 0 });
  readonly arrastando = signal(false);
  private arrastoInicioX = 0;
  private arrastoScrollInicio = 0;
  private houveArrasto = false;

  readonly imagemAmpliada = signal<string | null>(null);
  readonly videoAmpliado = signal<string | null>(null);

  readonly skeletonTabs = Array.from({ length: 5 });
  readonly skeletonItens = Array.from({ length: 6 });
  readonly skeletonPassos = Array.from({ length: 4 });
  readonly skeletonStats = Array.from({ length: 6 });

  // A área pública só enxerga atualizações marcadas como visíveis. As
  // ocultas continuam existindo na edição, só não aparecem para o usuário.
  readonly atualizacoesVisiveis = computed<Atualizacao[]>(
    () => this.edicao()?.atualizacoes.filter((atualizacao) => atualizacao.visivel) ?? [],
  );

  readonly itensFiltrados = computed(() => {
    const filtro = this.filtro();
    // "Todos" nunca inclui próximos passos, eles só aparecem na section
    // dedicada da lateral, pra não duplicar o mesmo item nos dois lugares.
    const todas = this.atualizacoesVisiveis().filter((item) => item.categoria !== 'proximos-passos');
    return filtro === 'todos' ? todas : todas.filter((item) => item.categoria === filtro);
  });

  readonly proximosPassos = computed(() =>
    this.atualizacoesVisiveis().filter((item) => item.categoria === 'proximos-passos'),
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

  constructor() {
    // Se a aba selecionada sumir (ex.: o admin ocultou o último item daquela
    // categoria em tempo real), volta para "Todos" em vez de ficar num
    // filtro inexistente sem nenhuma aba marcada.
    effect(() => {
      const abas = this.abas();
      if (!abas.some((aba) => aba.valor === this.filtro())) {
        this.filtro.set('todos');
      }
    });

    effect(() => {
      this.filtro();
      this.abas();
      requestAnimationFrame(() => this.atualizarIndicador());
    });
  }

  ngAfterViewInit(): void {
    requestAnimationFrame(() => this.atualizarIndicador());
    this.tabBtns?.changes.subscribe(() => requestAnimationFrame(() => this.atualizarIndicador()));
  }

  @HostListener('window:resize')
  onResize(): void {
    this.atualizarIndicador();
  }

  private atualizarIndicador(): void {
    const indice = this.abas().findIndex((aba) => aba.valor === this.filtro());
    const botao = this.tabBtns?.get(indice)?.nativeElement;
    if (!botao) return;
    this.indicador.set({ largura: botao.offsetWidth, posicao: botao.offsetLeft });
  }

  corCategoria(categoria: CategoriaAtualizacao): CorAcento {
    return CORES_CATEGORIA[categoria];
  }

  // Imagem em tela cheia (lightbox)
  ampliarImagem(url: string): void {
    this.imagemAmpliada.set(url);
  }

  fecharImagemAmpliada(): void {
    this.imagemAmpliada.set(null);
  }

  // O player embutido do YouTube não reduz bem os próprios controles em
  // espaços pequenos (como o card de uma atualização), os ícones ficam
  // grandes e se sobrepõem. Por isso o vídeo só toca dentro do lightbox, num
  // tamanho grande o suficiente pros controles nativos do YouTube caberem.
  ampliarVideo(videoId: string): void {
    this.videoAmpliado.set(videoId);
  }

  fecharVideoAmpliado(): void {
    this.videoAmpliado.set(null);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.fecharImagemAmpliada();
    this.fecharVideoAmpliado();
  }

  // O id extraído já passou pela validação da regex do youtube.util (só
  // letras, números, - e _), então é seguro marcar a URL de embed como
  // confiável para o Angular não bloquear o iframe.
  urlEmbedSeguro(videoId: string): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${urlEmbedYoutube(videoId)}?autoplay=1&rel=0`);
  }

  selecionarFiltro(valor: FiltroCategoria): void {
    if (this.houveArrasto) {
      this.houveArrasto = false;
      return;
    }
    this.filtro.set(valor);
  }

  // Arrastar a nav de categorias com o mouse (touch já rola nativamente).
  // A captura do ponteiro só acontece quando um arrasto de verdade é
  // detectado (>4px). Se ela rodasse já no pointerdown, o clique nativo dos
  // botões (que depende do pointerup "completar" no mesmo elemento) quebra,
  // mesmo num simples clique sem nenhum arrasto.
  private ponteiroAtivoId: number | null = null;

  iniciarArrasto(evento: PointerEvent): void {
    const el = this.tabsScrollRef?.nativeElement;
    if (!el) return;
    this.ponteiroAtivoId = evento.pointerId;
    this.houveArrasto = false;
    this.arrastoInicioX = evento.clientX;
    this.arrastoScrollInicio = el.scrollLeft;
  }

  moverArrasto(evento: PointerEvent): void {
    const el = this.tabsScrollRef?.nativeElement;
    if (!el || this.ponteiroAtivoId !== evento.pointerId) return;

    const delta = evento.clientX - this.arrastoInicioX;

    if (!this.arrastando()) {
      if (Math.abs(delta) <= 4) return;
      this.arrastando.set(true);
      this.houveArrasto = true;
      el.setPointerCapture(evento.pointerId);
    }

    el.scrollLeft = this.arrastoScrollInicio - delta;
  }

  finalizarArrasto(): void {
    this.arrastando.set(false);
    this.ponteiroAtivoId = null;
  }
}
