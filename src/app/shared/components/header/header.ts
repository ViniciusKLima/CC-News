import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EditionService } from '../../../core/services/edition.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  private readonly editionService = inject(EditionService);

  readonly ultimaEdicao = this.editionService.ultimaEdicaoPublica;
}
