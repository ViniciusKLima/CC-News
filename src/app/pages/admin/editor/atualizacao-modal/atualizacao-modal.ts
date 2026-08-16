import { Component, HostListener, OnInit, inject, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Atualizacao, CategoriaAtualizacao, labelCategoria } from '../../../../core/models/edition.model';

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

@Component({
  selector: 'app-atualizacao-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './atualizacao-modal.html',
  styleUrl: './atualizacao-modal.scss',
})
export class AtualizacaoModal implements OnInit {
  private readonly fb = inject(FormBuilder);

  readonly categoria = input.required<CategoriaAtualizacao>();
  readonly atualizacaoEditando = input<Atualizacao | null>(null);

  readonly salvar = output<Omit<Atualizacao, 'id'>>();
  readonly fechar = output<void>();

  readonly icones = ICONES_DISPONIVEIS;
  readonly tituloMaxlength = TITULO_MAXLENGTH;
  readonly descricaoMaxlength = DESCRICAO_MAXLENGTH;
  readonly impactoMaxlength = IMPACTO_MAXLENGTH;
  readonly labelCategoria = labelCategoria;

  readonly form = this.fb.nonNullable.group({
    icone: ['bi-stars', Validators.required],
    titulo: ['', [Validators.required, Validators.maxLength(TITULO_MAXLENGTH)]],
    descricao: ['', [Validators.required, Validators.maxLength(DESCRICAO_MAXLENGTH)]],
    impacto: ['', [Validators.required, Validators.maxLength(IMPACTO_MAXLENGTH)]],
    midiaTipo: ['imagem' as 'imagem' | 'video'],
    midiaUrl: [''],
  });

  ngOnInit(): void {
    // Inputs só ficam disponíveis após a construção do componente — o
    // pré-preenchimento precisa acontecer aqui, não no constructor.
    const editando = this.atualizacaoEditando();
    if (editando) {
      this.form.setValue({
        icone: editando.icone,
        titulo: editando.titulo,
        descricao: editando.descricao,
        impacto: editando.impacto,
        midiaTipo: editando.midia?.tipo ?? 'imagem',
        midiaUrl: editando.midia?.url ?? '',
      });
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

  onSalvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const valores = this.form.getRawValue();
    const urlMidia = valores.midiaUrl.trim();

    this.salvar.emit({
      categoria: this.categoria(),
      icone: valores.icone,
      titulo: valores.titulo.trim(),
      descricao: valores.descricao.trim(),
      impacto: valores.impacto.trim(),
      midia: urlMidia ? { tipo: valores.midiaTipo, url: urlMidia } : undefined,
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
