export class ReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportError';
  }
}

export class InvalidPetDataError extends ReportError {
  constructor(message = 'Datos de mascota inválidos') {
    super(message);
    this.name = 'InvalidPetDataError';
  }
}

export class InvalidLocationError extends ReportError {
  constructor(message = 'Ubicación inválida') {
    super(message);
    this.name = 'InvalidLocationError';
  }
}

export class InvalidContactError extends ReportError {
  constructor(message = 'Datos de contacto inválidos') {
    super(message);
    this.name = 'InvalidContactError';
  }
}

export class ImageUploadError extends ReportError {
  constructor(message = 'Error al subir imagen') {
    super(message);
    this.name = 'ImageUploadError';
  }
}

export class ReportSubmissionError extends ReportError {
  constructor(message = 'Error al enviar reporte') {
    super(message);
    this.name = 'ReportSubmissionError';
  }
}

export class NetworkError extends ReportError {
  constructor(message = 'Error de conexión') {
    super(message);
    this.name = 'NetworkError';
  }
}
