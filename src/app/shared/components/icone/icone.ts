import { Component, computed, input } from '@angular/core';
import { iconeEhImagem } from '../../../core/models/interface-config.model';

// Renderiza um ícone configurável (ver InterfaceConfigService e a aba
// Aparência do admin): uma classe do Bootstrap Icons (ex.: "bi-stars") ou
// uma imagem enviada (URL do Cloudinary). Herda o tamanho e a cor do
// elemento pai (font-size/color), assim como um <i> normal, para poder
// substituir um <i class="bi ..."> sem precisar de ajustes no lugar onde é
// usado.
@Component({
  selector: 'app-icone',
  imports: [],
  templateUrl: './icone.html',
  styleUrl: './icone.scss',
})
export class Icone {
  readonly valor = input.required<string>();

  protected readonly ehImagem = computed(() => iconeEhImagem(this.valor()));
}
