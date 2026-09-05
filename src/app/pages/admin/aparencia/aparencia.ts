import { AfterViewChecked, Component, ElementRef, OnDestroy, ViewChild, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CATEGORIAS_ATUALIZACAO, CategoriaAtualizacao, TIPOS_EDICAO, TipoEdicao } from '../../../core/models/edition.model';
import { CorPar, IconeBiblioteca, InterfaceConfig } from '../../../core/models/interface-config.model';
import { InterfaceConfigService } from '../../../core/services/interface-config.service';
import { CloudinaryService } from '../../../core/services/cloudinary.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { CONFIRMACOES } from '../../../core/services/confirm-dialog.presets';
import { AdminSidebar } from '../../../shared/components/admin-sidebar/admin-sidebar';
import { Icone } from '../../../shared/components/icone/icone';
import { IconePicker } from '../../../shared/components/icone-picker/icone-picker';
import { HeroBanner } from '../../../shared/components/hero-banner/hero-banner';
import { TransparenciaBanner } from '../../../shared/components/transparencia-banner/transparencia-banner';
import { urlImagemOtimizada } from '../../../core/services/cloudinary.service';

const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;
const HISTORICO_MAXIMO = 3;

// Paginação da biblioteca de ícones: mesma ideia do seletor de ícone do
// modal de atualização (largura medida por ResizeObserver, colunas
// calculadas a partir dela), só que com 6 linhas por página em vez de 3.
const BIBLIOTECA_ICONE_LARGURA_MIN = 44;
const BIBLIOTECA_ICONE_GAP = 8;
const BIBLIOTECA_ICONE_LINHAS_POR_PAGINA = 6;
const BIBLIOTECA_ICONES_POR_PAGINA_INICIAL = 24;

/** Chave de qual seletor de ícone (se algum) está aberto no momento: uma categoria, o banner de transparência, ou nenhum. */
type ChaveSeletorIcone = CategoriaAtualizacao | 'transparencia' | null;

// Aba "Aparência" do admin: personalização visual da plataforma (logo,
// banner e texto do hero, cores dos tipos de edição e das categorias de
// atualização, biblioteca de ícones, rodapé e banner de transparência).
// Restrita a administradores (ver adminRoleGuard em app.routes.ts).
//
// Trabalha sobre um rascunho local (cópia do config atual) em vez de formar
// um FormGroup — o objeto tem vários formatos aninhados diferentes (records
// por tipo/categoria, lista de ícones), o que deixaria um FormGroup mais
// complicado do que o ganho valeria. Só grava no Firestore quando o admin
// clica em "Salvar alterações".
//
// O hero e o banner de transparência são editados diretamente em cima do
// componente visual real (app-hero-banner / app-transparencia-banner, modo
// `editavel`), não por um formulário separado — assim o admin vê exatamente
// como o texto vai ficar no ar enquanto digita.
@Component({
  selector: 'app-aparencia',
  imports: [FormsModule, AdminSidebar, Icone, IconePicker, HeroBanner, TransparenciaBanner],
  templateUrl: './aparencia.html',
  styleUrl: './aparencia.scss',
})
export class Aparencia implements AfterViewChecked, OnDestroy {
  private readonly interfaceConfig = inject(InterfaceConfigService);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);

  protected readonly tiposEdicao = TIPOS_EDICAO;
  protected readonly categoriasAtualizacao = CATEGORIAS_ATUALIZACAO;
  protected readonly urlImagemOtimizada = urlImagemOtimizada;

  protected readonly rascunho = signal<InterfaceConfig | null>(null);

  protected readonly carregado = this.interfaceConfig.carregado;
  protected readonly salvando = signal(false);

  protected readonly faviconEnviando = signal(false);
  protected readonly faviconProgresso = signal(0);
  protected readonly logoEnviando = signal(false);
  protected readonly logoProgresso = signal(0);
  protected readonly logoAdminEnviando = signal(false);
  protected readonly logoAdminProgresso = signal(0);
  protected readonly heroEnviando = signal(false);
  protected readonly heroProgresso = signal(0);
  protected readonly iconeEnviando = signal(false);
  protected readonly iconeProgresso = signal(0);

  protected readonly novoIconeNome = signal('');
  protected readonly seletorIconeAberto = signal<ChaveSeletorIcone>(null);

  // Paginação da biblioteca de ícones (ver constantes no topo do arquivo):
  // preenche a grade em linhas, e some com o scroll horizontal a partir de
  // 6 linhas cheias, virando página em vez de esticar a tela.
  @ViewChild('bibliotecaGrid') private readonly bibliotecaGridRef?: ElementRef<HTMLElement>;
  private bibliotecaResizeObserver?: ResizeObserver;
  protected readonly paginaIconeBiblioteca = signal(0);
  protected readonly iconesBibliotecaPorPagina = signal(BIBLIOTECA_ICONES_POR_PAGINA_INICIAL);
  protected readonly totalPaginasIconeBiblioteca = computed(() =>
    Math.max(1, Math.ceil((this.rascunho()?.icones.length ?? 0) / this.iconesBibliotecaPorPagina())),
  );
  protected readonly iconesBibliotecaPaginados = computed(() => {
    const icones = this.rascunho()?.icones ?? [];
    const tamanho = this.iconesBibliotecaPorPagina();
    const inicio = this.paginaIconeBiblioteca() * tamanho;
    return icones.slice(inicio, inicio + tamanho);
  });

  private inicializado = false;

  constructor() {
    // Se a página atual deixar de existir (ícone removido, ou a largura
    // mudou e agora cabem menos por página), volta pra última válida.
    effect(() => {
      const total = this.totalPaginasIconeBiblioteca();
      if (this.paginaIconeBiblioteca() >= total) {
        this.paginaIconeBiblioteca.set(total - 1);
      }
    });

    // Inicializa o rascunho uma única vez, assim que a configuração real
    // termina de carregar do Firestore (ver InterfaceConfigService) — evita
    // começar com os valores padrão e "pular" para os salvos um instante
    // depois, ou pior, sobrescrever uma edição em andamento do admin.
    effect(() => {
      if (this.carregado() && !this.inicializado) {
        this.inicializado = true;
        this.rascunho.set(structuredClone(this.interfaceConfig.config()));
      }
    });
  }

  // A grade só existe no DOM depois que o rascunho carrega (fica atrás de
  // @if no template), então na primeira passada o #bibliotecaGrid ainda não
  // existe — ver mesmo raciocínio em edition.ts (sidebar sticky). A guarda
  // "!bibliotecaResizeObserver" garante que o observer é criado uma única
  // vez, assim que a grade aparecer.
  ngAfterViewChecked(): void {
    const grade = this.bibliotecaGridRef?.nativeElement;
    if (this.bibliotecaResizeObserver || !grade) return;

    this.bibliotecaResizeObserver = new ResizeObserver((entradas) => {
      const largura = entradas[0]?.contentRect.width;
      if (largura) this.atualizarIconesBibliotecaPorPagina(largura);
    });
    this.bibliotecaResizeObserver.observe(grade);
  }

  ngOnDestroy(): void {
    this.bibliotecaResizeObserver?.disconnect();
  }

  private atualizarIconesBibliotecaPorPagina(largura: number): void {
    const colunas = Math.max(
      1,
      Math.floor((largura + BIBLIOTECA_ICONE_GAP) / (BIBLIOTECA_ICONE_LARGURA_MIN + BIBLIOTECA_ICONE_GAP)),
    );
    this.iconesBibliotecaPorPagina.set(colunas * BIBLIOTECA_ICONE_LINHAS_POR_PAGINA);
  }

  protected iconeBibliotecaPaginaAnterior(): void {
    this.paginaIconeBiblioteca.update((pagina) => Math.max(0, pagina - 1));
  }

  protected iconeBibliotecaPaginaSeguinte(): void {
    this.paginaIconeBiblioteca.update((pagina) => Math.min(this.totalPaginasIconeBiblioteca() - 1, pagina + 1));
  }

  protected corTipo(tipo: TipoEdicao): CorPar {
    return this.rascunho()!.tipos[tipo];
  }

  protected corCategoria(categoria: CategoriaAtualizacao) {
    return this.rascunho()!.categorias[categoria];
  }

  protected atualizarCampo<K extends 'faviconUrl' | 'logoUrl' | 'logoAdminUrl' | 'heroTituloKicker' | 'heroTitulo' | 'heroTexto' | 'footerTitulo' | 'footerTexto'>(
    campo: K,
    valor: string,
  ): void {
    this.rascunho.update((r) => (r ? { ...r, [campo]: valor } : r));
  }

  protected atualizarCorTipo(tipo: TipoEdicao, campo: keyof CorPar, valor: string): void {
    if (!HEX_PATTERN.test(valor)) return;
    this.rascunho.update((r) => (r ? { ...r, tipos: { ...r.tipos, [tipo]: { ...r.tipos[tipo], [campo]: valor } } } : r));
  }

  protected atualizarCorCategoria(categoria: CategoriaAtualizacao, campo: keyof CorPar, valor: string): void {
    if (!HEX_PATTERN.test(valor)) return;
    this.rascunho.update((r) =>
      r ? { ...r, categorias: { ...r.categorias, [categoria]: { ...r.categorias[categoria], [campo]: valor } } } : r,
    );
  }

  protected atualizarIconeCategoria(categoria: CategoriaAtualizacao, icone: string): void {
    this.rascunho.update((r) =>
      r ? { ...r, categorias: { ...r.categorias, [categoria]: { ...r.categorias[categoria], icone } } } : r,
    );
    this.seletorIconeAberto.set(null);
  }

  protected atualizarTransparencia(campo: 'icone' | 'titulo' | 'descricao' | 'textoBotao' | 'linkBotao', valor: string): void {
    this.rascunho.update((r) => (r ? { ...r, transparencia: { ...r.transparencia, [campo]: valor } } : r));
    if (campo === 'icone') this.seletorIconeAberto.set(null);
  }

  protected alternarSeletorIcone(chave: ChaveSeletorIcone): void {
    this.seletorIconeAberto.update((atual) => (atual === chave ? null : chave));
  }

  /** Troca o banner atual por um dos últimos usados, guardando o atual no histórico no lugar dele. */
  protected usarBannerHistorico(url: string): void {
    this.rascunho.update((r) => {
      if (!r) return r;
      const historicoSemNovo = r.heroBannerHistorico.filter((item) => item !== url);
      const novoHistorico = [r.heroBannerUrl, ...historicoSemNovo].filter((item) => item && item !== url);
      return { ...r, heroBannerUrl: url, heroBannerHistorico: dedup(novoHistorico).slice(0, HISTORICO_MAXIMO) };
    });
  }

  protected atualizarFocoMobileX(valor: number): void {
    this.rascunho.update((r) => (r ? { ...r, heroBannerFocoMobileX: valor } : r));
  }

  protected async onFaviconSelecionado(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.faviconEnviando.set(true);
    this.faviconProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.faviconProgresso.set(p));
      this.atualizarCampo('faviconUrl', url);
      this.toastService.sucesso('Favicon enviado. Clique em Salvar para aplicar.');
    } catch (erro) {
      this.toastService.erro(mensagemErro(erro, 'Não foi possível enviar o favicon.'));
    } finally {
      this.faviconEnviando.set(false);
    }
  }

  protected async onLogoSelecionado(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.logoEnviando.set(true);
    this.logoProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.logoProgresso.set(p));
      this.atualizarCampo('logoUrl', url);
      this.toastService.sucesso('Logo enviada. Clique em Salvar para aplicar.');
    } catch (erro) {
      this.toastService.erro(mensagemErro(erro, 'Não foi possível enviar a logo.'));
    } finally {
      this.logoEnviando.set(false);
    }
  }

  protected async onLogoAdminSelecionado(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.logoAdminEnviando.set(true);
    this.logoAdminProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.logoAdminProgresso.set(p));
      this.atualizarCampo('logoAdminUrl', url);
      this.toastService.sucesso('Logo do admin enviada. Clique em Salvar para aplicar.');
    } catch (erro) {
      this.toastService.erro(mensagemErro(erro, 'Não foi possível enviar a logo do admin.'));
    } finally {
      this.logoAdminEnviando.set(false);
    }
  }

  protected async onHeroSelecionado(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.heroEnviando.set(true);
    this.heroProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.heroProgresso.set(p));
      const anterior = this.rascunho()!.heroBannerUrl;
      const novoHistorico = dedup([anterior, ...this.rascunho()!.heroBannerHistorico].filter((item) => item && item !== url)).slice(
        0,
        HISTORICO_MAXIMO,
      );
      this.rascunho.update((r) => (r ? { ...r, heroBannerUrl: url, heroBannerHistorico: novoHistorico } : r));
      this.toastService.sucesso('Banner enviado. Clique em Salvar para aplicar.');
    } catch (erro) {
      this.toastService.erro(mensagemErro(erro, 'Não foi possível enviar o banner.'));
    } finally {
      this.heroEnviando.set(false);
    }
  }

  protected adicionarIconePorNome(): void {
    const nome = this.novoIconeNome().trim();
    if (!nome) return;

    const classe = nome.startsWith('bi-') ? nome : `bi-${nome}`;
    const jaExiste = this.rascunho()!.icones.some((icone) => icone.valor === classe);
    if (jaExiste) {
      this.toastService.erro('Esse ícone já está na biblioteca.');
      return;
    }

    const novoIcone: IconeBiblioteca = { id: crypto.randomUUID(), nome: nome.replace(/^bi-/, '').replace(/-/g, ' '), tipo: 'bootstrap', valor: classe };
    this.rascunho.update((r) => (r ? { ...r, icones: [...r.icones, novoIcone] } : r));
    this.novoIconeNome.set('');
    this.toastService.sucesso('Ícone adicionado à biblioteca. Confira se ele apareceu corretamente antes de salvar.');
  }

  protected async onNovoIconeArquivo(evento: Event): Promise<void> {
    const arquivo = this.extrairArquivo(evento);
    if (!arquivo) return;

    this.iconeEnviando.set(true);
    this.iconeProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/interface', (p) => this.iconeProgresso.set(p));
      const novoIcone: IconeBiblioteca = { id: crypto.randomUUID(), nome: arquivo.name.replace(/\.[^.]+$/, ''), tipo: 'upload', valor: url };
      this.rascunho.update((r) => (r ? { ...r, icones: [...r.icones, novoIcone] } : r));
      this.toastService.sucesso('Ícone enviado. Clique em Salvar para aplicar.');
    } catch (erro) {
      this.toastService.erro(mensagemErro(erro, 'Não foi possível enviar o ícone.'));
    } finally {
      this.iconeEnviando.set(false);
    }
  }

  protected async removerIcone(icone: IconeBiblioteca): Promise<void> {
    const confirmado = await this.confirmDialogService.confirmar(CONFIRMACOES.excluirIcone(icone.nome));
    if (!confirmado) return;

    this.rascunho.update((r) => (r ? { ...r, icones: r.icones.filter((item) => item.id !== icone.id) } : r));
  }

  protected async salvar(): Promise<void> {
    const rascunho = this.rascunho();
    if (!rascunho) return;

    this.salvando.set(true);
    try {
      await this.interfaceConfig.salvar(rascunho);
      this.toastService.sucesso('Aparência atualizada com sucesso.');
    } catch (erro) {
      this.toastService.erro(mensagemErroFirestore(erro));
    } finally {
      this.salvando.set(false);
    }
  }

  private extrairArquivo(evento: Event): File | null {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0] ?? null;
    input.value = '';
    if (arquivo && !arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido.');
      return null;
    }
    return arquivo;
  }
}

function dedup(valores: string[]): string[] {
  return [...new Set(valores)];
}

/** Usa a mensagem do erro capturado quando ela existe e é específica (ex.: a do Cloudinary em CloudinaryService), senão cai no texto genérico do chamador. */
function mensagemErro(erro: unknown, generico: string): string {
  return erro instanceof Error && erro.message ? erro.message : `${generico} Tente novamente.`;
}

/**
 * Traduz um erro do Firestore (ver InterfaceConfigService.salvar) numa
 * mensagem que diz o que fazer a seguir, em vez de um "tente novamente"
 * sem contexto. O caso mais comum aqui é "permission-denied": a coleção
 * "configuracao" é nova no projeto e precisa de uma regra de segurança
 * própria no Firestore (ver o aviso deixado no commit que criou esta tela).
 */
function mensagemErroFirestore(erro: unknown): string {
  const codigo = (erro as { code?: string } | null)?.code;

  switch (codigo) {
    case 'permission-denied':
      return 'Sem permissão para salvar: a regra de segurança do Firestore para a coleção "configuracao" ainda não foi criada. Peça para quem administra o projeto adicionar essa regra no Console do Firebase (Firestore Database > Regras).';
    case 'unavailable':
    case 'deadline-exceeded':
      return 'Não foi possível conectar ao Firestore. Verifique sua internet e tente novamente.';
    case 'unauthenticated':
      return 'Sua sessão expirou. Atualize a página, faça login de novo e tente salvar novamente.';
    case undefined:
      return 'Não foi possível salvar as alterações. Tente novamente em instantes.';
    default:
      return `Não foi possível salvar as alterações (erro "${codigo}"). Tente novamente em instantes.`;
  }
}
