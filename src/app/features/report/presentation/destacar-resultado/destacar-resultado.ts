import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

type EstadoPago = 'exito' | 'pendiente' | 'error';

@Component({
  selector: 'app-destacar-resultado',
  standalone: true,
  imports: [RouterLink],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './destacar-resultado.html',
})
export class DestacarResultadoPage {
  private readonly route = inject(ActivatedRoute);

  readonly publicId = this.route.snapshot.paramMap.get('publicId') ?? '';
  readonly estado = (this.route.snapshot.data['estado'] ?? 'pendiente') as EstadoPago;
}
