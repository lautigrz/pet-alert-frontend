import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../../report/application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ReportDetail } from '../../../report/infrastructure/report.http';
import { InteractiveMapComponent, MapLocation } from '../../../../shared/component/interactive-map/interactive-map.component';

interface ExistingImage {
  cloudinaryId: string;
  url: string;
}

@Component({
  selector: 'app-edit-report-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, InteractiveMapComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './edit-report-page.component.html',
  styleUrls: ['./edit-report-page.component.css'],
})
export class EditReportPageComponent implements OnInit {
  private readonly fb           = inject(FormBuilder);
  private readonly route        = inject(ActivatedRoute);
  private readonly router       = inject(Router);
  private readonly reportService = inject(ReportService);
  private readonly toastService  = inject(ToastService);

  readonly loading     = signal(true);
  readonly submitting  = signal(false);
  readonly serverError = signal<string | null>(null);
  readonly report      = signal<ReportDetail | null>(null);

  existingImages = signal<ExistingImage[]>([]);
  newPhotos = signal<{ preview: string; file: File }[]>([]);

  readonly maxPhotos = 4;
  readonly slots = [0, 1, 2, 3];

  private currentLocation: MapLocation | null = null;
  private publicId!: string;

  readonly form = this.fb.nonNullable.group({
    description: [''],
    occurredAt:  [''],
    petName:     [''],
    animalType:  [''],
    genderType:  [''],
    sizeType:    [''],
    breed:       [''],
    color:       [''],
    hasIdCollar: [false],
    //isInTransit: [false],
  });

  async ngOnInit(): Promise<void> {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    try {
      const r = await this.reportService.getReportByPublicId(this.publicId);
      this.report.set(r);

      this.existingImages.set(
        r.details.images.map(img => ({
          cloudinaryId: this.extractCloudinaryId(img.url),
          url: img.url,
        }))
      );

      this.currentLocation = {
        address:   r.location.address,
        latitude:  r.location.latitude,
        longitude: r.location.longitude,
      };

      this.form.patchValue({
        description: r.description ?? '',
        occurredAt:  r.occurredAt ? this.toLocalDatetimeValue(new Date(r.occurredAt)) : '',
        petName:     r.details.petName ?? r.details.name ?? '',
        animalType:  r.details.animalType ?? '',
        genderType:  r.details.genderType ?? '',
        sizeType:    r.details.sizeType   ?? '',
        breed:       r.details.breed      ?? '',
        color:       r.details.color      ?? '',
        hasIdCollar: r.details.hasIdCollar ?? false,
        //isInTransit: r.details.isInTransit ?? false,
      });
    } catch (error) {
      this.serverError.set(
        error instanceof Error ? error.message : 'No se pudo cargar el reporte',
      );
    } finally {
      this.loading.set(false);
    }
  }


  get totalPhotos(): number {
    return this.existingImages().length + this.newPhotos().length;
  }

  removeExisting(cloudinaryId: string): void {
    this.existingImages.update(imgs => imgs.filter(i => i.cloudinaryId !== cloudinaryId));
  }

  removeNew(index: number): void {
    this.newPhotos.update(p => p.filter((_, i) => i !== index));
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      if (this.totalPhotos >= this.maxPhotos) break;
      const reader = new FileReader();
      reader.onload = () => {
        if (this.totalPhotos < this.maxPhotos) {
          this.newPhotos.update(p => [...p, { preview: reader.result as string, file }]);
        }
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }


  onLocationChange(loc: MapLocation): void {
    this.currentLocation = loc;
  }

  get initialLocation(): MapLocation | null {
    const r = this.report();
    if (!r) return null;
    return { address: r.location.address, latitude: r.location.latitude, longitude: r.location.longitude };
  }

  get pinImageUrl(): string | null {
    return this.existingImages()[0]?.url ?? this.newPhotos()[0]?.preview ?? null;
  }

  async submit(): Promise<void> {
    this.submitting.set(true);
    this.serverError.set(null);

    const {
      description, occurredAt,
      petName, animalType, genderType, sizeType, breed, color, hasIdCollar, //isInTransit
    } = this.form.getRawValue();

    const isSighting = this.report()?.type === 'SIGHTING';

    try {
      await this.reportService.updateReport({
        publicId:     this.publicId,
        description:  description || undefined,
        occurredAt:   occurredAt  ? new Date(occurredAt) : undefined,
        location:     this.currentLocation ?? undefined,
        keepImageIds: this.existingImages().map(i => i.cloudinaryId),
        newPhotos:    this.newPhotos().map(p => p.file),
        ...(isSighting
          ? {
              sightingDetails: {
                petName:     petName    || undefined,
                animalType:  (animalType as 'DOG' | 'CAT'            | undefined) || undefined,
                genderType:  (genderType as 'MALE' | 'FEMALE'        | null)      || null,
                sizeType:    (sizeType   as 'SMALL' | 'MEDIUM' | 'LARGE' | null)  || null,
                breed:       breed  || undefined,
                color:       color  || undefined,
                hasIdCollar,
                //isInTransit,
              },
            }
          : {
              lostDetails: {
                petPublicId: this.report()!.details.publicId!,
                name:        petName || null,
                animalType:  (animalType as 'DOG' | 'CAT'            | undefined) || undefined,
                genderType:  (genderType as 'MALE' | 'FEMALE'        | null)      || null,
                sizeType:    (sizeType   as 'SMALL' | 'MEDIUM' | 'LARGE' | null)  || null,
                breed:       breed  || undefined,
                color:       color  || undefined,
                hasIdCollar,
              },
            }),
      });

      this.toastService.success('✔️ Reporte actualizado correctamente');
      this.router.navigate(['/detalle-reporte', this.publicId]);
    } catch (error) {
      this.serverError.set(
        error instanceof Error ? error.message : 'Error al guardar',
      );
    } finally {
      this.submitting.set(false);
    }
  }


  private toLocalDatetimeValue(d: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private extractCloudinaryId(url: string): string {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : url;
  }
}
