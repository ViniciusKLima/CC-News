import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

// Fecha modais só quando o clique COMEÇA e TERMINA no próprio elemento (o
// backdrop), não só onde ele termina. O evento nativo `click` dispara no
// ancestral comum entre o `mousedown` e o `mouseup` — então selecionar um
// texto dentro do modal e soltar o botão do mouse fora dele (arrastando)
// também contava como "clique no backdrop" pro `click`, fechando o modal
// sem essa ser a intenção. Rastreando os dois eventos separadamente, só
// fecha quando ambos realmente aconteceram no backdrop.
@Directive({
  selector: '[appFecharAoClicarFora]',
})
export class FecharAoClicarFora {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private mousedownNoElemento = false;

  readonly fecharAoClicarFora = output<void>();

  @HostListener('mousedown', ['$event'])
  onMouseDown(evento: MouseEvent): void {
    this.mousedownNoElemento = evento.target === this.elementRef.nativeElement;
  }

  @HostListener('mouseup', ['$event'])
  onMouseUp(evento: MouseEvent): void {
    if (this.mousedownNoElemento && evento.target === this.elementRef.nativeElement) {
      this.fecharAoClicarFora.emit();
    }
    this.mousedownNoElemento = false;
  }
}
