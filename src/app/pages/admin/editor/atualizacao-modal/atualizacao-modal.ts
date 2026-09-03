import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
  ViewChild,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  Atualizacao,
  CATEGORIAS_ATUALIZACAO,
  CategoriaAtualizacao,
  MidiaAtualizacao,
  labelCategoria,
} from '../../../../core/models/edition.model';
import { CloudinaryService, urlImagemOtimizada } from '../../../../core/services/cloudinary.service';
import { ToastService } from '../../../../core/services/toast.service';
import { extrairIdYoutube } from '../../../../core/utils/youtube.util';
import { FecharAoClicarFora } from '../../../../shared/directives/fechar-ao-clicar-fora.directive';

const ICONES_DISPONIVEIS = [
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
];

// Precisa refletir o minmax(38px, 1fr) e o gap de 8px do grid de ícones no
// SCSS: são usados pra calcular quantas colunas cabem por linha e, com isso,
// quantos ícones cabem por página sem sobrar espaço vazio na última coluna.
const ICONE_LARGURA_MIN = 38;
const ICONE_GAP = 8;
const ICONE_LINHAS_POR_PAGINA = 3;
const ICONES_POR_PAGINA_INICIAL = 20;

const TITULO_MAXLENGTH = 70;
const DESCRICAO_MAXLENGTH = 220;
const IMPACTO_MAXLENGTH = 140;

// Modal de criação/edição de uma atualização dentro de uma edição. Emite
// o resultado por output em vez de salvar diretamente, quem decide como
// persistir (Firestore ou lista em memória) é o Editor que o abre.
@Component({
  selector: 'app-atualizacao-modal',
  imports: [ReactiveFormsModule, FecharAoClicarFora],
  templateUrl: './atualizacao-modal.html',
  styleUrl: './atualizacao-modal.scss',
})
export class AtualizacaoModal implements OnInit, AfterViewInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly toastService = inject(ToastService);

  @ViewChild('iconeGrid') private readonly iconeGridRef?: ElementRef<HTMLElement>;
  private resizeObserver?: ResizeObserver;
  private primeiraMedicaoFeita = false;

  readonly categoria = input.required<CategoriaAtualizacao>();
  readonly atualizacaoEditando = input<Atualizacao | null>(null);

  // Categoria efetiva do item, editável pelo seletor no cabeçalho do modal
  // (ex.: corrigir uma atualização criada na categoria errada). Começa com
  // o valor do input `categoria`, mas pode ser trocada livremente depois.
  readonly categoriaSelecionada = signal<CategoriaAtualizacao>('novidades');

  readonly salvar = output<Omit<Atualizacao, 'id'>>();
  readonly salvarEContinuar = output<Omit<Atualizacao, 'id'>>();
  readonly fechar = output<void>();

  readonly icones = ICONES_DISPONIVEIS;
  readonly categorias = CATEGORIAS_ATUALIZACAO;
  readonly tituloMaxlength = TITULO_MAXLENGTH;
  readonly descricaoMaxlength = DESCRICAO_MAXLENGTH;
  readonly impactoMaxlength = IMPACTO_MAXLENGTH;
  readonly labelCategoria = labelCategoria;
  readonly urlImagemOtimizada = urlImagemOtimizada;

  readonly midiaEnviando = signal(false);
  readonly midiaProgresso = signal(0);
  readonly midiaVideoErro = signal<string | null>(null);

  // Paginação da grade de ícones: com muitas opções, mostrar tudo de uma vez
  // fica poluído, então navega em blocos por vez. O tamanho do bloco é
  // recalculado pelo ResizeObserver (ver ngAfterViewInit) de acordo com
  // quantas colunas cabem na largura atual do modal, pra não sobrar espaço
  // vazio numa página enquanto ícones "extras" ficam empurrados pra próxima.
  readonly paginaIcone = signal(0);
  readonly iconesPorPagina = signal(ICONES_POR_PAGINA_INICIAL);
  readonly totalPaginasIcone = computed(() => Math.max(1, Math.ceil(this.icones.length / this.iconesPorPagina())));
  readonly iconesPaginados = computed(() => {
    const tamanho = this.iconesPorPagina();
    const inicio = this.paginaIcone() * tamanho;
    return this.icones.slice(inicio, inicio + tamanho);
  });

  readonly form = this.fb.nonNullable.group({
    icone: ['bi-stars', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(TITULO_MAXLENGTH)]],
    descricao: ['', [Validators.required, Validators.maxLength(DESCRICAO_MAXLENGTH)]],
    impacto: ['', [Validators.maxLength(IMPACTO_MAXLENGTH)]],
    midiaTipo: ['nenhum' as 'nenhum' | 'imagem' | 'video'],
    midiaImagemUrl: [''],
    midiaVideoUrl: [''],
  });

  constructor() {
    this.form.controls.midiaImagemUrl.disable({ emitEvent: false });
    this.form.controls.midiaVideoUrl.disable({ emitEvent: false });
    this.form.controls.midiaTipo.valueChanges.subscribe((tipo) => this.aplicarTipoMidia(tipo));
  }

  ngOnInit(): void {
    // Inputs só ficam disponíveis após a construção do componente. O
    // pré-preenchimento precisa acontecer aqui, não no constructor.
    this.categoriaSelecionada.set(this.categoria());

    const editando = this.atualizacaoEditando();
    if (editando) {
      const midia = editando.midia;
      this.form.setValue({
        icone: editando.icone,
        titulo: editando.titulo,
        descricao: editando.descricao,
        impacto: editando.impacto,
        midiaTipo: midia?.tipo ?? 'nenhum',
        midiaImagemUrl: midia?.tipo === 'imagem' ? midia.url : '',
        midiaVideoUrl: midia?.tipo === 'video' ? midia.url : '',
      });
      this.aplicarTipoMidia(midia?.tipo ?? 'nenhum');
    }
  }

  ngAfterViewInit(): void {
    const grade = this.iconeGridRef?.nativeElement;
    if (!grade) return;

    this.resizeObserver = new ResizeObserver((entradas) => {
      const largura = entradas[0]?.contentRect.width;
      if (largura) this.atualizarIconesPorPagina(largura);
    });
    this.resizeObserver.observe(grade);
    this.atualizarIconesPorPagina(grade.clientWidth);
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
  }

  // Colunas cabíveis na largura atual (mesma conta do CSS Grid com
  // auto-fill) vezes um número fixo de linhas, pra aproveitar o espaço
  // horizontal disponível em vez de um total de ícones fixo por página.
  private atualizarIconesPorPagina(largura: number): void {
    const colunas = Math.max(1, Math.floor((largura + ICONE_GAP) / (ICONE_LARGURA_MIN + ICONE_GAP)));
    const porPagina = colunas * ICONE_LINHAS_POR_PAGINA;
    this.iconesPorPagina.set(porPagina);

    if (!this.primeiraMedicaoFeita) {
      this.primeiraMedicaoFeita = true;
      const indiceIcone = this.icones.indexOf(this.form.controls.icone.value);
      this.paginaIcone.set(indiceIcone > -1 ? Math.floor(indiceIcone / porPagina) : 0);
      return;
    }

    const totalPaginas = Math.max(1, Math.ceil(this.icones.length / porPagina));
    if (this.paginaIcone() >= totalPaginas) {
      this.paginaIcone.set(totalPaginas - 1);
    }
  }

  get modoEdicao(): boolean {
    return !!this.atualizacaoEditando();
  }

  onCategoriaAlterada(evento: Event): void {
    this.categoriaSelecionada.set((evento.target as HTMLSelectElement).value as CategoriaAtualizacao);
  }

  selecionarIcone(icone: string): void {
    this.form.controls.icone.setValue(icone);
  }

  iconePaginaAnterior(): void {
    this.paginaIcone.update((pagina) => Math.max(0, pagina - 1));
  }

  iconePaginaSeguinte(): void {
    this.paginaIcone.update((pagina) => Math.min(this.totalPaginasIcone() - 1, pagina + 1));
  }

  campoInvalido(campo: 'icone' | 'titulo' | 'descricao' | 'impacto'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  // Mídia da atualização: nenhuma, foto enviada ao Cloudinary ou link do YouTube.
  // O campo que não está em uso fica desabilitado e é limpo ao trocar de tipo.
  private aplicarTipoMidia(tipo: 'nenhum' | 'imagem' | 'video'): void {
    if (tipo === 'imagem') {
      this.form.controls.midiaImagemUrl.enable({ emitEvent: false });
      this.form.controls.midiaVideoUrl.reset('', { emitEvent: false });
      this.form.controls.midiaVideoUrl.disable({ emitEvent: false });
    } else if (tipo === 'video') {
      this.form.controls.midiaVideoUrl.enable({ emitEvent: false });
      this.form.controls.midiaImagemUrl.reset('', { emitEvent: false });
      this.form.controls.midiaImagemUrl.disable({ emitEvent: false });
    } else {
      this.form.controls.midiaImagemUrl.reset('', { emitEvent: false });
      this.form.controls.midiaVideoUrl.reset('', { emitEvent: false });
      this.form.controls.midiaImagemUrl.disable({ emitEvent: false });
      this.form.controls.midiaVideoUrl.disable({ emitEvent: false });
    }
    this.midiaVideoErro.set(null);
  }

  async onImagemSelecionada(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido.');
      return;
    }

    this.midiaEnviando.set(true);
    this.midiaProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/atualizacoes', (percentual) =>
        this.midiaProgresso.set(percentual),
      );
      this.form.controls.midiaImagemUrl.setValue(url);
      this.toastService.sucesso('Imagem enviada com sucesso.');
    } catch {
      this.toastService.erro('Não foi possível enviar a imagem. Tente novamente.');
    } finally {
      this.midiaEnviando.set(false);
    }
  }

  removerImagemMidia(): void {
    this.form.controls.midiaImagemUrl.setValue('');
  }

  onMidiaVideoUrlAlterada(): void {
    this.midiaVideoErro.set(null);
  }

  private midiaParaSalvar(valores: {
    midiaTipo: 'nenhum' | 'imagem' | 'video';
    midiaImagemUrl: string;
    midiaVideoUrl: string;
  }): MidiaAtualizacao | undefined {
    if (valores.midiaTipo === 'imagem' && valores.midiaImagemUrl) {
      return { tipo: 'imagem', url: valores.midiaImagemUrl };
    }
    if (valores.midiaTipo === 'video' && valores.midiaVideoUrl) {
      return { tipo: 'video', url: valores.midiaVideoUrl.trim() };
    }
    return undefined;
  }

  // Próximos passos usa um layout público de linha do tempo (só ícone,
  // título e descrição, ver edition.html) — impacto e mídia não fazem
  // sentido nessa categoria, então o modal nem mostra esses campos pra ela
  // (ver atualizacao-modal.html) e aqui garante que não são salvos, mesmo
  // que um item antigo tenha esses dados de antes dessa mudança.
  protected get semImpactoNemMidia(): boolean {
    return this.categoriaSelecionada() === 'proximos-passos';
  }

  private construirDados(): Omit<Atualizacao, 'id'> | null {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return null;
    }

    const valores = this.form.getRawValue();

    if (!this.semImpactoNemMidia) {
      if (valores.midiaTipo === 'imagem' && (this.midiaEnviando() || !valores.midiaImagemUrl)) {
        this.toastService.erro('Aguarde o envio da imagem terminar antes de salvar.');
        return null;
      }

      if (valores.midiaTipo === 'video' && !extrairIdYoutube(valores.midiaVideoUrl)) {
        this.midiaVideoErro.set('Informe um link válido do YouTube.');
        return null;
      }
    }

    return {
      categoria: this.categoriaSelecionada(),
      icone: valores.icone,
      titulo: valores.titulo.trim(),
      descricao: valores.descricao.trim(),
      impacto: this.semImpactoNemMidia ? '' : valores.impacto.trim(),
      midia: this.semImpactoNemMidia ? undefined : this.midiaParaSalvar(valores),
      visivel: this.atualizacaoEditando()?.visivel ?? true,
    };
  }

  onSalvar(): void {
    const dados = this.construirDados();
    if (!dados) return;

    this.salvar.emit(dados);
  }

  // Salva o item atual e limpa o formulário sem fechar o modal, pra criar
  // vários itens seguidos sem precisar reabrir o modal a cada um. Só faz
  // sentido pra novas atualizações (ver modal-rodape no template).
  onSalvarEContinuar(): void {
    const dados = this.construirDados();
    if (!dados) return;

    this.salvarEContinuar.emit(dados);

    this.form.reset({
      icone: 'bi-stars',
      titulo: '',
      descricao: '',
      impacto: '',
      midiaTipo: 'nenhum',
      midiaImagemUrl: '',
      midiaVideoUrl: '',
    });
    this.aplicarTipoMidia('nenhum');
    this.paginaIcone.set(0);
  }

  onFechar(): void {
    this.fechar.emit();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onFechar();
  }
}
