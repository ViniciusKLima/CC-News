import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Edicao } from '../../../core/models/edition.model';
import { EditionService } from '../../../core/services/edition.service';

@Component({
  selector: 'app-editor',
  imports: [RouterLink],
  templateUrl: './editor.html',
  styleUrl: './editor.scss',
})
export class Editor {
  private readonly route = inject(ActivatedRoute);
  private readonly editionService = inject(EditionService);

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
}
