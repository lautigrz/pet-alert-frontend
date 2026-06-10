import { Component, computed, input } from '@angular/core';
import { ReportDetail } from '../../../infrastructure/report.http';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';

@Component({
  selector: 'app-report-contact',
  standalone: true,
  imports: [PetIconComponent],
  templateUrl: './report-contact.html',
})
export class ReportContactComponent {
  report = input.required<ReportDetail>();
  esPropio = input(false);

  userPublicId = computed(() => this.report().user);
  username = computed(() => this.report().user.username);
  imagenUsuario = computed(() => this.report().user.photoUrl || 'https://i.pinimg.com/474x/a8/da/22/a8da222be70a71e7858bf752065d5cc3.jpg');
}
