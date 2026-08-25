import { Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Atualizacao, CategoriaAtualizacao, MidiaAtualizacao, labelCategoria } from '../../../../core/models/edition.model';
import { CloudinaryService, urlImagemOtimizada } from '../../../../core/services/cloudinary.service';
import { ToastService } from '../../../../core/services/toast.service';
import { extrairIdYoutube } from '../../../../core/utils/youtube.util';

const ICONES_DISPONIVEIS = [
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
];

const TITULO_MAXLENGTH = 70;
const DESCRICAO_MAXLENGTH = 220;
const IMPACTO_MAXLENGTH = 140;

// Modal de criação/edição de uma atualização dentro de uma edição. Emite
// o resultado por output em vez de salvar diretamente, quem decide como
// persistir (Firestore ou lista em memória) é o Editor que o abre.
@Component({
  selector: 'app-atualizacao-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './atualizacao-modal.html',
  styleUrl: './atualizacao-modal.scss',
})
export class AtualizacaoModal implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly cloudinaryService = inject(CloudinaryService);
  private readonly toastService = inject(ToastService);

  readonly categoria = input.required<CategoriaAtualizacao>();
  readonly atualizacaoEditando = input<Atualizacao | null>(null);

  readonly salvar = output<Omit<Atualizacao, 'id'>>();
  readonly fechar = output<void>();

  readonly icones = ICONES_DISPONIVEIS;
  readonly tituloMaxlength = TITULO_MAXLENGTH;
  readonly descricaoMaxlength = DESCRICAO_MAXLENGTH;
  readonly impactoMaxlength = IMPACTO_MAXLENGTH;
  readonly labelCategoria = labelCategoria;
  readonly urlImagemOtimizada = urlImagemOtimizada;

  readonly midiaEnviando = signal(false);
  readonly midiaProgresso = signal(0);
  readonly midiaVideoErro = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    icone: ['bi-stars', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(TITULO_MAXLENGTH)]],
    descricao: ['', [Validators.required, Validators.maxLength(DESCRICAO_MAXLENGTH)]],
    impacto: ['', [Validators.required, Validators.maxLength(IMPACTO_MAXLENGTH)]],
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

  get modoEdicao(): boolean {
    return !!this.atualizacaoEditando();
  }

  selecionarIcone(icone: string): void {
    this.form.controls.icone.setValue(icone);
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

  onSalvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();

    if (valores.midiaTipo === 'imagem' && (this.midiaEnviando() || !valores.midiaImagemUrl)) {
      this.toastService.erro('Aguarde o envio da imagem terminar antes de salvar.');
      return;
    }

    if (valores.midiaTipo === 'video' && !extrairIdYoutube(valores.midiaVideoUrl)) {
      this.midiaVideoErro.set('Informe um link válido do YouTube.');
      return;
    }

    this.salvar.emit({
      categoria: this.categoria(),
      icone: valores.icone,
      titulo: valores.titulo.trim(),
      descricao: valores.descricao.trim(),
      impacto: valores.impacto.trim(),
      midia: this.midiaParaSalvar(valores),
      visivel: this.atualizacaoEditando()?.visivel ?? true,
    });
  }

  onFechar(): void {
    this.fechar.emit();
  }

  onBackdropClick(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) {
      this.onFechar();
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.onFechar();
  }
}
