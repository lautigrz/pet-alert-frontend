export class ContentReportNetworkError extends Error {
  constructor() {
    super('No pudimos conectar con el servidor. Reintentá en unos segundos.');
    this.name = 'ContentReportNetworkError';
  }
}

export class AlreadyReportedError extends Error {
  constructor() {
    super('Ya enviaste una denuncia para este contenido.');
    this.name = 'AlreadyReportedError';
  }
}

export class CannotReportOwnContentError extends Error {
  constructor() {
    super('No podés denunciar tu propio contenido.');
    this.name = 'CannotReportOwnContentError';
  }
}

export class UnexpectedContentReportError extends Error {
  constructor() {
    super('Ocurrió un error inesperado. Reintentá en unos segundos.');
    this.name = 'UnexpectedContentReportError';
  }
}
