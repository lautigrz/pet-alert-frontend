import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { MissionResponseService } from '../../application/mission-response.service';

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './mission-detail.html',
  styleUrl: './mission-detail.css'
})
export class MissionDetailPage implements OnInit {

  private readonly missionResponseService =
    inject(MissionResponseService);

  readonly mission = signal<any | null>(null);

  readonly responses = signal<any[]>([]);

  comentario = '';

  imagen?: File;

  async ngOnInit(): Promise<void> {

    this.mission.set(history.state.mission);
    await this.cargarRespuestas();

    console.log(this.mission());

  }

  seleccionarImagen(event: Event): void {

  const input = event.target as HTMLInputElement;

  if (input.files?.length) {

    this.imagen = input.files[0];

  }

}

async enviarMision(): Promise<void> {

  if (!this.comentario.trim()) {

    alert("Escribí un comentario");

    return;

  }

  await this.missionResponseService.create({

    missionPublicId: this.mission()!.public_id,

    comment: this.comentario,

    photoUrl: null

  });

  alert("Misión enviada correctamente");

}

async cargarRespuestas(): Promise<void> {

  const data = await this.missionResponseService.getResponses(

    this.mission()!.public_id

  );

  this.responses.set(data);

}

}