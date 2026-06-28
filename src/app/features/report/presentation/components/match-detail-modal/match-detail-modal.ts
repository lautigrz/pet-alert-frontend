import { Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';

import { Match } from '../../../domain/match.model';
import { ReportDetail } from '../../../infrastructure/report.http';
import { PetIconComponent } from '../../../../../shared/component/pet-icon/pet-icon.component';

interface ComparisonRow {
  label: string;
  source: string;
  matched: string;
  match: boolean;
}

const EMPTY = '—';

@Component({
  selector: 'app-match-detail-modal',
  standalone: true,
  imports: [DatePipe, PetIconComponent],
  templateUrl: './match-detail-modal.html',
})
export class MatchDetailModalComponent {
  match = input.required<Match>();
  sourceReport = input.required<ReportDetail>();
  matchedReport = input<ReportDetail | null>(null);
  loadingDetail = input(false);

  closed = output<void>();
  verReporte = output<Match>();
  contactar = output<Match>();

  readonly totalPercentage = computed(() => this.toPercentage(this.match().score));
  readonly imagePercentage = computed(() => this.toPercentage(this.match().imageScore));
  readonly descriptionPercentage = computed(() => this.toPercentage(this.match().descriptionScore));

  readonly comparisons = computed<ComparisonRow[]>(() => {
    const source = this.sourceReport().details;
    const matched = this.matchedReport()?.details;
    if (!matched) return [];
    return [
      this.buildRow('Raza', source.breed, matched.breed),
      this.buildRow('Color', source.color, matched.color),
      this.buildRow('Género', this.genderLabel(source.genderType), this.genderLabel(matched.genderType)),
      this.buildRow('Tamaño', this.sizeLabel(source.sizeType), this.sizeLabel(matched.sizeType)),
      this.buildRow('Collar', this.collarLabel(source.hasIdCollar), this.collarLabel(matched.hasIdCollar)),
    ];
  });

  readonly matchedCount = computed(() => this.comparisons().filter((row) => row.match).length);

  onClose(): void {
    this.closed.emit();
  }

  onVerReporte(): void {
    this.verReporte.emit(this.match());
  }

  onContactar(): void {
    this.contactar.emit(this.match());
  }

  private toPercentage(value: number | null): string | null {
    return value === null ? null : `${Math.round(value * 100)}%`;
  }

  private buildRow(label: string, source: string | undefined, matched: string | undefined): ComparisonRow {
    const a = (source ?? '').trim();
    const b = (matched ?? '').trim();
    const match = a !== '' && b !== '' && a.toLowerCase() === b.toLowerCase();
    return { label, source: a || EMPTY, matched: b || EMPTY, match };
  }

  private genderLabel(value: string | undefined): string {
    if (value === 'MALE') return 'Macho';
    if (value === 'FEMALE') return 'Hembra';
    return '';
  }

  private sizeLabel(value: string | undefined): string {
    if (value === 'SMALL') return 'Pequeño';
    if (value === 'MEDIUM') return 'Mediano';
    if (value === 'LARGE') return 'Grande';
    return '';
  }

  private collarLabel(value: boolean | undefined): string {
    if (value === true) return 'Con collar';
    if (value === false) return 'Sin collar';
    return '';
  }
}
