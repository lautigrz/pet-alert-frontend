import { Component, OnInit, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PetIconComponent } from '../../../../shared/component/pet-icon/pet-icon.component';
import { ReportService } from '../../application/report.service';
import { ToastService } from '../../../../shared/application/toast.service';
import { ReportDetail } from '../../infrastructure/report.http';
import { DOG_BREEDS, PET_COLORS } from '../../domain/pet-options';
import { CatalogService } from '../../application/catalog.service';

interface ExistingImage {
  cloudinaryId: string;
  url: string;
}

@Component({
  selector: 'app-report-edit-data',
  standalone: true,
  imports: [PetIconComponent],
  host: { class: 'flex flex-1 flex-col' },
  templateUrl: './report-edit-data.html',
})
export class ReportEditDataPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly reportService = inject(ReportService);
  private readonly toastService = inject(ToastService);

  readonly maxPhotos = 4;
  readonly slots = [0, 1, 2, 3];

  readonly loading = signal(true);
  readonly submitting = signal(false);
  readonly serverError = signal<string | null>(null);

  petName = signal('');
  petSpecies = signal<'perro' | 'gato'>('perro');
  petBreed = signal('');
  petColor = signal('');
  petDescription = signal('');
  petGender = signal<'macho' | 'hembra'>('macho');
  petSize = signal<'pequeño' | 'mediano' | 'grande'>('mediano');
  hasIdentification = signal<'si' | 'no'>('no');

  existingImages = signal<ExistingImage[]>([]);
  newPhotos = signal<{ preview: string; file: File }[]>([]);

  private readonly catalog = inject(CatalogService);
  readonly colorOptions = signal<string[]>(PET_COLORS);
  readonly breedOptions = signal<string[]>(DOG_BREEDS);

  constructor() {
    this.catalog.getColors().then((colors) => this.colorOptions.set(colors));
    effect(() => {
      const species = this.petSpecies() === 'gato' ? 'CAT' : 'DOG';
      this.catalog.getBreeds(species).then((breeds) => this.breedOptions.set(breeds));
    });
  }

  protected readonly report = signal<ReportDetail | null>(null);
  private publicId!: string;

  readonly esPerdida = computed(() => this.report()?.type === 'LOST');
  readonly tituloPreview = computed(() => this.petName() || 'Nombre');

  async ngOnInit(): Promise<void> {
    this.publicId = this.route.snapshot.paramMap.get('publicId')!;
    try {
      const r = await this.reportService.getReportByPublicId(this.publicId);
      this.report.set(r);
      this.prefill(r);
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

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    for (const file of files) {
      if (this.totalPhotos >= this.maxPhotos) break;
      const reader = new FileReader();
      reader.onload = () => {
        if (this.totalPhotos < this.maxPhotos) {
          this.newPhotos.update((p) => [...p, { preview: reader.result as string, file }]);
        }
      };
      reader.readAsDataURL(file);
    }
    input.value = '';
  }

  removeExisting(cloudinaryId: string): void {
    this.existingImages.update((imgs) => imgs.filter((i) => i.cloudinaryId !== cloudinaryId));
  }

  removeNew(index: number): void {
    this.newPhotos.update((p) => p.filter((_, i) => i !== index));
  }

  coverPreview = computed(() => this.existingImages()[0]?.url ?? this.newPhotos()[0]?.preview ?? null);

  async guardar(): Promise<void> {
    const r = this.report();
    if (!r) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try {
      await this.reportService.updateReport({
        publicId: this.publicId,
        description: this.petDescription() || undefined,
        occurredAt: r.occurredAt ? new Date(r.occurredAt) : undefined,
        location: {
          address: r.location.address,
          latitude: r.location.latitude,
          longitude: r.location.longitude,
        },
        keepImageIds: this.existingImages().map((i) => i.cloudinaryId),
        newPhotos: this.newPhotos().map((p) => p.file),
        ...(r.type === 'SIGHTING'
          ? {
              sightingDetails: {
                petName: this.petName() || undefined,
                animalType: this.animalTypeDb(),
                genderType: this.genderDb(),
                sizeType: this.sizeDb(),
                breed: this.petBreed() || undefined,
                color: this.petColor() || undefined,
                hasIdCollar: this.hasIdentification() === 'si',
              },
            }
          : {
              lostDetails: {
                petPublicId: r.details.publicId!,
                name: this.petName() || null,
                animalType: this.animalTypeDb(),
                genderType: this.genderDb(),
                sizeType: this.sizeDb(),
                breed: this.petBreed() || undefined,
                color: this.petColor() || undefined,
                hasIdCollar: this.hasIdentification() === 'si',
              },
            }),
      });

      this.toastService.success('Reporte actualizado correctamente');
      this.router.navigate(['/reports', this.publicId]);
    } catch (error) {
      this.serverError.set(error instanceof Error ? error.message : 'Error al guardar');
    } finally {
      this.submitting.set(false);
    }
  }

  cancelar(): void {
    this.router.navigate(['/reports', this.publicId]);
  }

  private prefill(r: ReportDetail): void {
    this.petName.set(r.details.name ?? r.details.petName ?? '');
    this.petSpecies.set(r.details.animalType === 'CAT' ? 'gato' : 'perro');
    this.petGender.set(r.details.genderType === 'FEMALE' ? 'hembra' : 'macho');
    this.petSize.set(
      r.details.sizeType === 'SMALL' ? 'pequeño' : r.details.sizeType === 'LARGE' ? 'grande' : 'mediano',
    );
    this.petBreed.set(r.details.breed ?? '');
    this.petColor.set(r.details.color ?? '');
    this.petDescription.set(r.description ?? '');
    this.hasIdentification.set(r.details.hasIdCollar ? 'si' : 'no');
    this.existingImages.set(
      (r.details.images ?? []).map((img) => ({
        cloudinaryId: this.extractCloudinaryId(img.url),
        url: img.url,
      })),
    );
  }

  private animalTypeDb(): 'DOG' | 'CAT' {
    return this.petSpecies() === 'gato' ? 'CAT' : 'DOG';
  }

  private genderDb(): 'MALE' | 'FEMALE' {
    return this.petGender() === 'hembra' ? 'FEMALE' : 'MALE';
  }

  private sizeDb(): 'SMALL' | 'MEDIUM' | 'LARGE' {
    return this.petSize() === 'pequeño' ? 'SMALL' : this.petSize() === 'grande' ? 'LARGE' : 'MEDIUM';
  }

  private extractCloudinaryId(url: string): string {
    const match = url.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/);
    return match ? match[1] : url;
  }
}
