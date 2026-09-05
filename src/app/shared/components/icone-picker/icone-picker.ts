import { Component, computed, output, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconeBiblioteca } from '../../../core/models/interface-config.model';
import { Icone } from '../icone/icone';

// Grade compacta de seleção de um ícone da biblioteca (ver InterfaceConfig),
// usada na aba Aparência do admin para escolher o ícone de uma categoria de
// atualização ou do banner de transparência. Diferente do seletor do modal
// de atualização (que pagina e não precisa filtrar), aqui a biblioteca pode
// crescer bastante com ícones enviados pelo próprio admin, então tem um
// campo de busca por nome em vez de paginação.
@Component({
  selector: 'app-icone-picker',
  imports: [FormsModule, Icone],
  templateUrl: './icone-picker.html',
  styleUrl: './icone-picker.scss',
})
export class IconePicker {
  readonly icones = input.required<IconeBiblioteca[]>();
  readonly selecionado = input<string>('');

  readonly escolher = output<string>();

  protected readonly busca = signal('');

  protected readonly iconesFiltrados = computed(() => {
    const termo = this.busca().trim().toLowerCase();
    if (!termo) return this.icones();
    return this.icones().filter((icone) => icone.nome.toLowerCase().includes(termo));
  });
}
