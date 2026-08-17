import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import {
  Atualizacao,
  CATEGORIAS_ATUALIZACAO,
  CategoriaAtualizacao,
  CorAcento,
  CORES_DESTAQUE,
  Edicao,
  MESES_NOMES,
  PeriodoEdicao,
  PosicaoImagemDestaque,
  POSICOES_IMAGEM_DESTAQUE,
  ServicoDestaque,
  StatusEdicao,
  TIPOS_EDICAO,
  TipoEdicao,
} from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';
import { ToastService } from '../../../core/services/toast.service';
import { AtualizacaoModal } from './atualizacao-modal/atualizacao-modal';

const ORDEM_TIPOS: TipoEdicao[] = ['semanal', 'mensal', 'anual', 'especial'];

const TITULO_MAXLENGTH = 70;
const RESUMO_MAXLENGTH = 200;
const TEMA_MAXLENGTH = 60;

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
  periodoSemanal: { dataInicio: string; dataFim: string };
  periodoMensal: { mes: string; ano: string };
  periodoAnual: { ano: string };
  periodoEspecial: { tema: string };
  servicoDestaque: { titulo: string; descricao: string; cor: CorAcento; imagemPosicao: PosicaoImagemDestaque };
}

@Component({
  selector: 'app-editor',
  imports: [ReactiveFormsModule, RouterLink, AtualizacaoModal],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly editionService = inject(EditionService);
  private readonly toastService = inject(ToastService);

  // Enquanto o service ainda está carregando o mock, não dá para saber se o
  // id existe ou não — evita mostrar "edição não encontrada" precocemente.
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
  readonly tiposEdicao = TIPOS_EDICAO;
  readonly categorias = CATEGORIAS_ATUALIZACAO;
  readonly ordemTipos = ORDEM_TIPOS;
  readonly meses = MESES_NOMES.map((nome, indice) => ({ valor: indice + 1, nome }));
  readonly anos = (() => {
    const anoAtual = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => anoAtual - 1 + i);
  })();

  readonly indiceSlide = signal(0);
  readonly salvando = signal(false);
  readonly capaPreviewUrl = signal<string | null>(null);

  readonly coresDestaque = CORES_DESTAQUE;
  readonly posicoesImagemDestaque = POSICOES_IMAGEM_DESTAQUE;
  readonly servicoDestaqueAtivo = signal(false);
  readonly imagemDestaquePreviewUrl = signal<string | null>(null);

  readonly modalAberto = signal<{
    categoria: CategoriaAtualizacao;
    atualizacaoEditando: Atualizacao | null;
  } | null>(null);

  private readonly atualizacoesPendentes = signal<Atualizacao[]>([]);

  readonly atualizacoes = computed<Atualizacao[]>(() =>
    this.modo() === 'editar' ? (this.edicao()?.atualizacoes ?? []) : this.atualizacoesPendentes(),
  );

  readonly form = this.fb.nonNullable.group({
    titulo: ['', [Validators.required, Validators.maxLength(TITULO_MAXLENGTH)]],
    resumo: ['', [Validators.maxLength(RESUMO_MAXLENGTH)]],
    tipo: this.fb.nonNullable.control<TipoEdicao | ''>('', Validators.required),
    status: this.fb.nonNullable.control<StatusEdicao>('arquivado', Validators.required),
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
      cor: this.fb.nonNullable.control<CorAcento>('azul'),
      imagemPosicao: this.fb.nonNullable.control<PosicaoImagemDestaque>('centro'),
    }),
  });

  private capaArquivo: File | null = null;
  private imagemDestaqueArquivo: File | null = null;
  private jaPreenchido = false;

  constructor() {
    this.desabilitarTodosPeriodos();
    this.form.controls.servicoDestaque.disable({ emitEvent: false });

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

    this.capaPreviewUrl.set(edicao.capaUrl ?? null);

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

  // --- Capa ---
  onCapaSelecionada(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido para a capa.');
      return;
    }

    this.capaArquivo = arquivo;
    this.capaPreviewUrl.set(URL.createObjectURL(arquivo));
  }

  removerCapa(): void {
    this.capaArquivo = null;
    this.capaPreviewUrl.set(null);
  }

  // --- Serviço em destaque ---
  alternarServicoDestaque(ativo: boolean): void {
    this.servicoDestaqueAtivo.set(ativo);

    if (ativo) {
      this.form.controls.servicoDestaque.enable({ emitEvent: false });
    } else {
      this.form.controls.servicoDestaque.reset(
        { titulo: '', descricao: '', cor: 'azul', imagemPosicao: 'centro' },
        { emitEvent: false },
      );
      this.form.controls.servicoDestaque.disable({ emitEvent: false });
      this.imagemDestaqueArquivo = null;
      this.imagemDestaquePreviewUrl.set(null);
    }
  }

  selecionarCorDestaque(cor: CorAcento): void {
    this.form.controls.servicoDestaque.controls.cor.setValue(cor);
  }

  selecionarPosicaoImagemDestaque(posicao: PosicaoImagemDestaque): void {
    this.form.controls.servicoDestaque.controls.imagemPosicao.setValue(posicao);
  }

  onImagemDestaqueSelecionada(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    if (!arquivo) return;

    if (!arquivo.type.startsWith('image/')) {
      this.toastService.erro('Selecione um arquivo de imagem válido para o destaque.');
      return;
    }

    this.imagemDestaqueArquivo = arquivo;
    this.imagemDestaquePreviewUrl.set(URL.createObjectURL(arquivo));
  }

  removerImagemDestaque(): void {
    this.imagemDestaqueArquivo = null;
    this.imagemDestaquePreviewUrl.set(null);
  }

  // --- Atualizações ---
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

    const id = this.edicaoId();
    if (this.modo() === 'editar' && id) {
      if (modal.atualizacaoEditando) {
        this.editionService.atualizarAtualizacao(id, modal.atualizacaoEditando.id, dados);
      } else {
        this.editionService.adicionarAtualizacao(id, dados);
      }
    } else if (modal.atualizacaoEditando) {
      const idEditando = modal.atualizacaoEditando.id;
      this.atualizacoesPendentes.update((lista) =>
        lista.map((item) => (item.id === idEditando ? { ...dados, id: idEditando } : item)),
      );
    } else {
      this.atualizacoesPendentes.update((lista) => [...lista, { ...dados, id: gerarIdLocal() }]);
    }

    this.fecharModal();
    this.toastService.sucesso(
      modal.atualizacaoEditando ? 'Atualização editada com sucesso.' : 'Atualização adicionada com sucesso.',
    );
  }

  excluirAtualizacao(atualizacao: Atualizacao): void {
    const confirmado = window.confirm(
      `Excluir a atualização "${atualizacao.titulo}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    const id = this.edicaoId();
    if (this.modo() === 'editar' && id) {
      this.editionService.removerAtualizacao(id, atualizacao.id);
    } else {
      this.atualizacoesPendentes.update((lista) => lista.filter((item) => item.id !== atualizacao.id));
    }
    this.toastService.sucesso('Atualização excluída com sucesso.');
  }

  alternarVisibilidade(atualizacao: Atualizacao): void {
    const id = this.edicaoId();
    if (this.modo() === 'editar' && id) {
      this.editionService.alternarVisibilidadeAtualizacao(id, atualizacao.id);
    } else {
      this.atualizacoesPendentes.update((lista) =>
        lista.map((item) => (item.id === atualizacao.id ? { ...item, visivel: !item.visivel } : item)),
      );
    }
  }

  atualizacoesPorCategoria(categoria: CategoriaAtualizacao): Atualizacao[] {
    return this.atualizacoes().filter((item) => item.categoria === categoria);
  }

  // --- Salvar / excluir edição ---
  salvar(): void {
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
      capaUrl: this.capaPreviewUrl() ?? undefined,
      servicoDestaque,
    };

    this.salvando.set(true);

    try {
      const id = this.edicaoId();
      if (this.modo() === 'editar' && id) {
        this.editionService.atualizar(id, dados);
        this.toastService.sucesso('Edição salva com sucesso.');
      } else {
        const nova = this.editionService.criar(dados);
        for (const atualizacao of this.atualizacoesPendentes()) {
          const { id: _descartado, ...resto } = atualizacao;
          this.editionService.adicionarAtualizacao(nova.id, resto);
        }
        this.toastService.sucesso('Edição criada com sucesso.');
      }
      this.router.navigateByUrl('/admin');
    } catch {
      this.toastService.erro('Não foi possível salvar a edição. Tente novamente em instantes.');
    } finally {
      this.salvando.set(false);
    }
  }

  excluirEdicao(): void {
    const edicao = this.edicao();
    if (!edicao) return;

    const confirmado = window.confirm(
      `Tem certeza que deseja excluir a edição "${edicao.titulo}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    this.editionService.remover(edicao.id);
    this.toastService.sucesso('Edição excluída com sucesso.');
    this.router.navigateByUrl('/admin');
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
