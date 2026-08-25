import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Atualizacao,
  CATEGORIAS_ATUALIZACAO,
  CategoriaAtualizacao,
  COR_PADRAO_PLATAFORMA,
  Edicao,
  MESES_NOMES,
  PeriodoEdicao,
  PosicaoImagemDestaque,
  POSICOES_IMAGEM_DESTAQUE,
  sanitizarSlug,
  ServicoDestaque,
  StatusEdicao,
  TIPOS_EDICAO,
  TipoEdicao,
} from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { CONFIRMACOES } from '../../../core/services/confirm-dialog.presets';
import { CloudinaryService, urlImagemOtimizada } from '../../../core/services/cloudinary.service';
import { AtualizacaoModal } from './atualizacao-modal/atualizacao-modal';
import { AtualizacaoCard } from '../../../shared/components/atualizacao-card/atualizacao-card';

const ORDEM_TIPOS: TipoEdicao[] = ['semanal', 'mensal', 'anual', 'especial'];

const TITULO_MAXLENGTH = 70;
const RESUMO_MAXLENGTH = 200;
const TEMA_MAXLENGTH = 60;
const SLUG_MAXLENGTH = 60;
const TEXTO_LIVRE_MAXLENGTH = 1000;
const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const HEX_PATTERN = /^#[0-9a-fA-F]{6}$/;

function gerarIdLocal(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `tmp-${crypto.randomUUID().slice(0, 8)}`
    : `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

interface ValoresFormulario {
  titulo: string;
  resumo: string;
  tipo: TipoEdicao | '';
  status: StatusEdicao;
  slug: string;
  textoLivre: string;
  capaCor: string;
  periodoSemanal: { dataInicio: string; dataFim: string };
  periodoMensal: { mes: string; ano: string };
  periodoAnual: { ano: string };
  periodoEspecial: { tema: string };
  servicoDestaque: { titulo: string; descricao: string; cor: string; imagemPosicao: PosicaoImagemDestaque };
}

// Formulário de criação e edição de edições: dados gerais, período (que
// muda de acordo com o tipo), capa, serviço em destaque e a lista de
// atualizações (abertas em um modal à parte, ver AtualizacaoModal).
@Component({
  selector: 'app-editor',
  imports: [ReactiveFormsModule, RouterLink, AtualizacaoModal, AtualizacaoCard],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly editionService = inject(EditionService);
  private readonly toastService = inject(ToastService);
  private readonly confirmDialogService = inject(ConfirmDialogService);
  private readonly cloudinaryService = inject(CloudinaryService);

  protected readonly urlImagemOtimizada = urlImagemOtimizada;

  // Enquanto o service ainda está carregando os dados, não dá para saber se
  // o id existe ou não. Evita mostrar "edição não encontrada" precocemente.
  readonly carregando = this.editionService.loading;
  readonly edicaoId = signal<string | null>(this.route.snapshot.paramMap.get('id'));
  readonly modo = computed<'criar' | 'editar'>(() => (this.edicaoId() ? 'editar' : 'criar'));

  readonly edicao = computed<Edicao | undefined>(() => {
    const id = this.edicaoId();
    return id ? this.editionService.obterPorId(id) : undefined;
  });

  readonly edicaoNaoEncontrada = computed(
    () => !this.carregando() && this.modo() === 'editar' && !this.edicao(),
  );

  readonly tituloMaxlength = TITULO_MAXLENGTH;
  readonly resumoMaxlength = RESUMO_MAXLENGTH;
  readonly temaMaxlength = TEMA_MAXLENGTH;
  readonly slugMaxlength = SLUG_MAXLENGTH;
  readonly textoLivreMaxlength = TEXTO_LIVRE_MAXLENGTH;
  readonly tiposEdicao = TIPOS_EDICAO;
  readonly categoriasRegulares = CATEGORIAS_ATUALIZACAO.filter((c) => c.valor !== 'proximos-passos');
  readonly categoriaProximosPassos = CATEGORIAS_ATUALIZACAO.find((c) => c.valor === 'proximos-passos')!;
  readonly ordemTipos = ORDEM_TIPOS;
  readonly origemAtual = window.location.origin;
  readonly meses = MESES_NOMES.map((nome, indice) => ({ valor: indice + 1, nome }));
  readonly anos = (() => {
    const anoAtual = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => anoAtual - 1 + i);
  })();

  readonly indiceSlide = signal(0);
  readonly salvando = signal(false);
  readonly capaModo = signal<'imagem' | 'cor'>('cor');
  readonly capaPreviewUrl = signal<string | null>(null);
  readonly capaEnviando = signal(false);
  readonly capaProgresso = signal(0);

  readonly corPadrao = COR_PADRAO_PLATAFORMA;
  readonly posicoesImagemDestaque = POSICOES_IMAGEM_DESTAQUE;
  readonly servicoDestaqueAtivo = signal(false);
  readonly imagemDestaquePreviewUrl = signal<string | null>(null);
  readonly destaqueEnviando = signal(false);
  readonly destaqueProgresso = signal(0);

  readonly slugAtivo = signal(false);

  // As quatro seções abaixo são opcionais, cada uma com seu próprio
  // interruptor (mesmo estilo do Serviço em destaque). Por padrão todas
  // ficam ligadas, exceto o texto livre. O Resumo depende das Atualizações
  // por categoria estarem ligadas, já que ele é a contagem de itens delas.
  readonly atualizacoesAtivas = signal(true);
  readonly resumoAtivo = signal(true);
  readonly proximosPassosAtivo = signal(true);
  readonly textoLivreAtivo = signal(false);

  // Gavetas: cada seção começa fechada, exceto "Dados da edição", pra não
  // sobrecarregar a tela com tudo aberto de uma vez. As 4 categorias
  // regulares (dentro de "Atualizações por categoria") começam abertas,
  // já que só aparecem depois que essa seção é aberta manualmente.
  readonly secoesAbertas = signal<Set<string>>(
    new Set(['dados', ...this.categoriasRegulares.map((c) => c.valor)]),
  );

  readonly modalAberto = signal<{
    categoria: CategoriaAtualizacao;
    atualizacaoEditando: Atualizacao | null;
  } | null>(null);

  // Atualizações ficam só em memória até o salvar() final da edição, tanto
  // criando quanto editando. Assim nada é publicado no meio da edição, só
  // quando o botão Salvar é clicado.
  private readonly atualizacoesPendentes = signal<Atualizacao[]>([]);

  readonly atualizacoes = this.atualizacoesPendentes.asReadonly();

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(TITULO_MAXLENGTH)]],
    resumo: ['', [Validators.maxLength(RESUMO_MAXLENGTH)]],
    tipo: this.fb.nonNullable.control<TipoEdicao | ''>('', Validators.required),
    status: this.fb.nonNullable.control<StatusEdicao>('arquivado', Validators.required),
    slug: ['', [Validators.maxLength(SLUG_MAXLENGTH), Validators.pattern(SLUG_PATTERN)]],
    textoLivre: ['', Validators.maxLength(TEXTO_LIVRE_MAXLENGTH)],
    capaCor: [COR_PADRAO_PLATAFORMA, Validators.pattern(HEX_PATTERN)],
    periodoSemanal: this.fb.nonNullable.group({
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
    }),
    periodoMensal: this.fb.nonNullable.group({
      mes: ['', Validators.required],
      ano: ['', Validators.required],
    }),
    periodoAnual: this.fb.nonNullable.group({
      ano: ['', Validators.required],
    }),
    periodoEspecial: this.fb.nonNullable.group({
      tema: ['', [Validators.required, Validators.maxLength(TEMA_MAXLENGTH)]],
    }),
    servicoDestaque: this.fb.nonNullable.group({
      titulo: ['', [Validators.required, Validators.maxLength(TITULO_MAXLENGTH)]],
      descricao: ['', [Validators.required, Validators.maxLength(RESUMO_MAXLENGTH)]],
      cor: [COR_PADRAO_PLATAFORMA, Validators.pattern(HEX_PATTERN)],
      imagemPosicao: this.fb.nonNullable.control<PosicaoImagemDestaque>('centro'),
    }),
  });

  private jaPreenchido = false;

  constructor() {
    this.desabilitarTodosPeriodos();
    this.form.controls.servicoDestaque.disable({ emitEvent: false });
    this.form.controls.slug.disable({ emitEvent: false });
    this.form.controls.textoLivre.disable({ emitEvent: false });

    this.form.controls.tipo.valueChanges.subscribe((tipo) => this.aplicarTipo(tipo));

    // Quando os dados chegam (modo edição), preenche o formulário uma única vez.
    effect(() => {
      const edicao = this.edicao();
      if (edicao && !this.jaPreenchido) {
        this.jaPreenchido = true;
        this.preencherFormulario(edicao);
      }
    });
  }

  secaoAberta(chave: string): boolean {
    return this.secoesAbertas().has(chave);
  }

  alternarSecao(chave: string): void {
    this.secoesAbertas.update((atual) => {
      const novo = new Set(atual);
      if (novo.has(chave)) {
        novo.delete(chave);
      } else {
        novo.add(chave);
      }
      return novo;
    });
  }

  private abrirSecao(chave: string): void {
    this.secoesAbertas.update((atual) => new Set(atual).add(chave));
  }

  private desabilitarTodosPeriodos(): void {
    this.form.controls.periodoSemanal.disable({ emitEvent: false });
    this.form.controls.periodoMensal.disable({ emitEvent: false });
    this.form.controls.periodoAnual.disable({ emitEvent: false });
    this.form.controls.periodoEspecial.disable({ emitEvent: false });
  }

  private aplicarTipo(tipo: TipoEdicao | ''): void {
    const grupos = {
      semanal: this.form.controls.periodoSemanal,
      mensal: this.form.controls.periodoMensal,
      anual: this.form.controls.periodoAnual,
      especial: this.form.controls.periodoEspecial,
    };

    for (const chave of Object.keys(grupos) as TipoEdicao[]) {
      const grupo = grupos[chave];
      if (chave === tipo) {
        grupo.enable({ emitEvent: false });
      } else {
        grupo.reset(undefined, { emitEvent: false });
        grupo.disable({ emitEvent: false });
      }
    }

    const indice = ORDEM_TIPOS.indexOf(tipo as TipoEdicao);
    this.indiceSlide.set(indice === -1 ? 0 : indice);
  }

  private preencherFormulario(edicao: Edicao): void {
    this.form.patchValue({
      titulo: edicao.titulo,
      resumo: edicao.resumo,
      tipo: edicao.tipo,
      status: edicao.status,
    });

    switch (edicao.periodo.tipo) {
      case 'semanal':
        this.form.controls.periodoSemanal.patchValue({
          dataInicio: edicao.periodo.dataInicio,
          dataFim: edicao.periodo.dataFim,
        });
        break;
      case 'mensal':
        this.form.controls.periodoMensal.patchValue({
          mes: String(edicao.periodo.mes),
          ano: String(edicao.periodo.ano),
        });
        break;
      case 'anual':
        this.form.controls.periodoAnual.patchValue({ ano: String(edicao.periodo.ano) });
        break;
      case 'especial':
        this.form.controls.periodoEspecial.patchValue({ tema: edicao.periodo.tema });
        break;
    }

    if (edicao.capaCor) {
      this.capaModo.set('cor');
      this.form.controls.capaCor.setValue(edicao.capaCor);
    } else {
      this.capaModo.set('imagem');
    }
    this.capaPreviewUrl.set(edicao.capaUrl ?? null);
    this.atualizacoesPendentes.set(edicao.atualizacoes);

    if (edicao.servicoDestaque) {
      this.servicoDestaqueAtivo.set(true);
      this.form.controls.servicoDestaque.enable({ emitEvent: false });
      this.form.controls.servicoDestaque.patchValue({
        titulo: edicao.servicoDestaque.titulo,
        descricao: edicao.servicoDestaque.descricao,
        cor: edicao.servicoDestaque.cor,
        imagemPosicao: edicao.servicoDestaque.imagemPosicao ?? 'centro',
      });
      this.imagemDestaquePreviewUrl.set(edicao.servicoDestaque.imagemUrl ?? null);
    }

    if (edicao.slug) {
      this.slugAtivo.set(true);
      this.form.controls.slug.enable({ emitEvent: false });
      this.form.controls.slug.setValue(edicao.slug);
    }

    if (edicao.textoLivre) {
      this.textoLivreAtivo.set(true);
      this.form.controls.textoLivre.enable({ emitEvent: false });
      this.form.controls.textoLivre.setValue(edicao.textoLivre);
    }

    this.atualizacoesAtivas.set(edicao.mostrarAtualizacoes !== false);
    this.resumoAtivo.set(edicao.mostrarAtualizacoes !== false && edicao.mostrarResumo !== false);
    this.proximosPassosAtivo.set(edicao.mostrarProximosPassos !== false);
  }

  campoInvalido(campo: 'titulo' | 'resumo' | 'tipo'): boolean {
    const controle = this.form.controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  servicoDestaqueCampoInvalido(campo: 'titulo' | 'descricao'): boolean {
    const controle = this.form.controls.servicoDestaque.controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  periodoCampoInvalido(
    grupo: 'periodoSemanal' | 'periodoMensal' | 'periodoAnual' | 'periodoEspecial',
    campo: string,
  ): boolean {
    const controle = (this.form.controls[grupo] as any).controls[campo];
    return controle.invalid && (controle.touched || controle.dirty);
  }

  // Capa da edição: o upload para o Cloudinary acontece assim que o arquivo é
  // selecionado, então ao salvar a edição a URL já está pronta.
  async onCapaSelecionada(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido para a capa.');
      return;
    }

    this.capaEnviando.set(true);
    this.capaProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/edicoes/capas', (percentual) =>
        this.capaProgresso.set(percentual),
      );
      this.capaPreviewUrl.set(url);
      this.toastService.sucesso('Capa enviada com sucesso.');
    } catch {
      this.toastService.erro('Não foi possível enviar a capa. Tente novamente.');
    } finally {
      this.capaEnviando.set(false);
    }
  }

  removerCapa(): void {
    this.capaPreviewUrl.set(null);
  }

  alternarCapaModo(modo: 'imagem' | 'cor'): void {
    this.capaModo.set(modo);
  }

  sanitizarCapaCorCampo(): void {
    let valor = this.form.controls.capaCor.value.trim();
    if (valor && !valor.startsWith('#')) valor = `#${valor}`;
    this.form.controls.capaCor.setValue(valor);
  }

  // Bloco opcional de serviço em destaque, exibido no topo da edição pública
  alternarServicoDestaque(ativo: boolean): void {
    this.servicoDestaqueAtivo.set(ativo);

    if (ativo) {
      this.form.controls.servicoDestaque.enable({ emitEvent: false });
      this.abrirSecao('destaque');
    } else {
      this.form.controls.servicoDestaque.reset(
        { titulo: '', descricao: '', cor: COR_PADRAO_PLATAFORMA, imagemPosicao: 'centro' },
        { emitEvent: false },
      );
      this.form.controls.servicoDestaque.disable({ emitEvent: false });
      this.imagemDestaquePreviewUrl.set(null);
    }
  }

  sanitizarDestaqueCorCampo(): void {
    const controle = this.form.controls.servicoDestaque.controls.cor;
    let valor = controle.value.trim();
    if (valor && !valor.startsWith('#')) valor = `#${valor}`;
    controle.setValue(valor);
  }

  selecionarPosicaoImagemDestaque(posicao: PosicaoImagemDestaque): void {
    this.form.controls.servicoDestaque.controls.imagemPosicao.setValue(posicao);
  }

  async onImagemDestaqueSelecionada(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido para o destaque.');
      return;
    }

    this.destaqueEnviando.set(true);
    this.destaqueProgresso.set(0);
    try {
      const url = await this.cloudinaryService.enviarImagem(arquivo, 'cc-news/destaques', (percentual) =>
        this.destaqueProgresso.set(percentual),
      );
      this.imagemDestaquePreviewUrl.set(url);
      this.toastService.sucesso('Imagem do destaque enviada com sucesso.');
    } catch {
      this.toastService.erro('Não foi possível enviar a imagem do destaque. Tente novamente.');
    } finally {
      this.destaqueEnviando.set(false);
    }
  }

  removerImagemDestaque(): void {
    this.imagemDestaquePreviewUrl.set(null);
  }

  // URL personalizada (opcional). Quando desligada, a edição usa o id
  // gerado pelo Firestore normalmente, como sempre funcionou.
  alternarSlug(ativo: boolean): void {
    this.slugAtivo.set(ativo);
    if (ativo) {
      this.form.controls.slug.enable({ emitEvent: false });
    } else {
      this.form.controls.slug.reset('', { emitEvent: false });
      this.form.controls.slug.disable({ emitEvent: false });
    }
  }

  sanitizarSlugCampo(): void {
    this.form.controls.slug.setValue(sanitizarSlug(this.form.controls.slug.value));
  }

  // Seções opcionais da edição pública: cada uma pode ser ligada ou
  // desligada independentemente, exceto o Resumo, que depende das
  // Atualizações por categoria (ver alternarAtualizacoes/alternarResumo).
  alternarAtualizacoes(ativo: boolean): void {
    this.atualizacoesAtivas.set(ativo);
    if (!ativo) {
      this.resumoAtivo.set(false);
    } else {
      this.abrirSecao('atualizacoes');
    }
  }

  alternarResumo(ativo: boolean): void {
    if (ativo && !this.atualizacoesAtivas()) return;
    this.resumoAtivo.set(ativo);
  }

  alternarProximosPassos(ativo: boolean): void {
    this.proximosPassosAtivo.set(ativo);
    if (ativo) this.abrirSecao('proximos-passos');
  }

  alternarTextoLivre(ativo: boolean): void {
    this.textoLivreAtivo.set(ativo);
    if (ativo) {
      this.form.controls.textoLivre.enable({ emitEvent: false });
      this.abrirSecao('texto-livre');
    } else {
      this.form.controls.textoLivre.reset('', { emitEvent: false });
      this.form.controls.textoLivre.disable({ emitEvent: false });
    }
  }

  // Atualizações da edição, criadas/editadas pelo AtualizacaoModal
  abrirModalNovaAtualizacao(categoria: CategoriaAtualizacao): void {
    this.modalAberto.set({ categoria, atualizacaoEditando: null });
  }

  abrirModalEditarAtualizacao(atualizacao: Atualizacao): void {
    this.modalAberto.set({ categoria: atualizacao.categoria, atualizacaoEditando: atualizacao });
  }

  fecharModal(): void {
    this.modalAberto.set(null);
  }

  salvarAtualizacao(dados: Omit<Atualizacao, 'id'>): void {
    const modal = this.modalAberto();
    if (!modal) return;

    if (modal.atualizacaoEditando) {
      const idEditando = modal.atualizacaoEditando.id;
      this.atualizacoesPendentes.update((lista) =>
        lista.map((item) => (item.id === idEditando ? { ...dados, id: idEditando } : item)),
      );
    } else {
      this.atualizacoesPendentes.update((lista) => [...lista, { ...dados, id: gerarIdLocal() }]);
    }

    this.fecharModal();
    this.toastService.sucesso(
      modal.atualizacaoEditando
        ? 'Atualização editada. Clique em Salvar para publicar as mudanças.'
        : 'Atualização adicionada. Clique em Salvar para publicar as mudanças.',
    );
  }

  async excluirAtualizacao(atualizacao: Atualizacao): Promise<void> {
    const confirmado = await this.confirmDialogService.confirmar(CONFIRMACOES.excluirAtualizacao(atualizacao.titulo));
    if (!confirmado) return;

    this.atualizacoesPendentes.update((lista) => lista.filter((item) => item.id !== atualizacao.id));
    this.toastService.sucesso('Atualização removida. Clique em Salvar para publicar as mudanças.');
  }

  alternarVisibilidade(atualizacao: Atualizacao): void {
    this.atualizacoesPendentes.update((lista) =>
      lista.map((item) => (item.id === atualizacao.id ? { ...item, visivel: !item.visivel } : item)),
    );
  }

  atualizacoesPorCategoria(categoria: CategoriaAtualizacao): Atualizacao[] {
    return this.atualizacoes().filter((item) => item.categoria === categoria);
  }

  // Salvar (criar ou atualizar) e excluir a edição
  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.toastService.erro('Não foi possível salvar: revise os campos destacados no formulário.');
      return;
    }

    const valores = this.form.getRawValue() as ValoresFormulario;
    const periodo = this.montarPeriodo(valores);
    if (!periodo) {
      this.toastService.erro('Selecione o tipo da edição e preencha o período corretamente.');
      return;
    }

    let slug: string | undefined;
    if (this.slugAtivo()) {
      slug = sanitizarSlug(valores.slug);
      if (!slug) {
        this.toastService.erro('Informe uma URL personalizada válida.');
        return;
      }
      const emUsoPorOutraEdicao = this.editionService
        .edicoes()
        .some((outra) => outra.slug === slug && outra.id !== this.edicaoId());
      if (emUsoPorOutraEdicao) {
        this.toastService.erro('Essa URL personalizada já está em uso por outra edição.');
        return;
      }
    }

    if (this.capaModo() === 'cor' && !HEX_PATTERN.test(valores.capaCor)) {
      this.toastService.erro('Informe uma cor sólida válida para a capa (hexadecimal).');
      return;
    }

    if (this.capaModo() === 'imagem' && !this.capaPreviewUrl()) {
      this.toastService.erro('Envie uma foto para a capa, ou troque para cor sólida.');
      return;
    }

    const servicoDestaque: ServicoDestaque | undefined = this.servicoDestaqueAtivo()
      ? {
          titulo: valores.servicoDestaque.titulo.trim(),
          descricao: valores.servicoDestaque.descricao.trim(),
          cor: valores.servicoDestaque.cor,
          imagemPosicao: valores.servicoDestaque.imagemPosicao,
          imagemUrl: this.imagemDestaquePreviewUrl() ?? undefined,
        }
      : undefined;

    const dados = {
      titulo: valores.titulo.trim(),
      resumo: valores.resumo.trim(),
      tipo: valores.tipo as TipoEdicao,
      periodo,
      status: valores.status,
      slug,
      capaUrl: this.capaModo() === 'imagem' ? this.capaPreviewUrl() ?? undefined : undefined,
      capaCor: this.capaModo() === 'cor' ? valores.capaCor : undefined,
      servicoDestaque,
      textoLivre: this.textoLivreAtivo() ? valores.textoLivre.trim() : undefined,
      atualizacoes: this.atualizacoesPendentes(),
      mostrarAtualizacoes: this.atualizacoesAtivas(),
      mostrarResumo: this.resumoAtivo(),
      mostrarProximosPassos: this.proximosPassosAtivo(),
    };

    this.salvando.set(true);

    try {
      const id = this.edicaoId();
      if (this.modo() === 'editar' && id) {
        await this.editionService.atualizar(id, dados);
        this.toastService.sucesso('Edição salva com sucesso.');
      } else {
        await this.editionService.criar(dados);
        this.toastService.sucesso('Edição criada com sucesso.');
      }
      this.router.navigateByUrl('/admin');
    } catch {
      this.toastService.erro('Não foi possível salvar a edição. Tente novamente em instantes.');
    } finally {
      this.salvando.set(false);
    }
  }

  async excluirEdicao(): Promise<void> {
    const edicao = this.edicao();
    if (!edicao) return;

    const confirmado = await this.confirmDialogService.confirmar(CONFIRMACOES.excluirEdicao(edicao.titulo));
    if (!confirmado) return;

    try {
      await this.editionService.remover(edicao.id);
      this.toastService.sucesso('Edição excluída com sucesso.');
      this.router.navigateByUrl('/admin');
    } catch {
      this.toastService.erro('Não foi possível excluir a edição. Tente novamente em instantes.');
    }
  }

  private montarPeriodo(valores: ValoresFormulario): PeriodoEdicao | null {
    switch (valores.tipo) {
      case 'semanal':
        if (!valores.periodoSemanal.dataInicio || !valores.periodoSemanal.dataFim) return null;
        return {
          tipo: 'semanal',
          dataInicio: valores.periodoSemanal.dataInicio,
          dataFim: valores.periodoSemanal.dataFim,
        };
      case 'mensal':
        if (!valores.periodoMensal.mes || !valores.periodoMensal.ano) return null;
        return {
          tipo: 'mensal',
          mes: Number(valores.periodoMensal.mes),
          ano: Number(valores.periodoMensal.ano),
        };
      case 'anual':
        if (!valores.periodoAnual.ano) return null;
        return { tipo: 'anual', ano: Number(valores.periodoAnual.ano) };
      case 'especial':
        if (!valores.periodoEspecial.tema) return null;
        return { tipo: 'especial', tema: valores.periodoEspecial.tema.trim() };
      default:
        return null;
    }
  }
}
