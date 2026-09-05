import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InterfaceConfigService } from '../../../core/services/interface-config.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
})
export class Footer {
  protected readonly interfaceConfig = inject(InterfaceConfigService);
}
