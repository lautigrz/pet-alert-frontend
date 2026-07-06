export class AppealNetworkError extends Error {
  constructor() {
    super('No pudimos conectar con el servidor. Reintentá en unos segundos.');
    this.name = 'AppealNetworkError';
  }
}

export class AlreadyAppealedError extends Error {
  constructor() {
    super('Ya enviaste una apelación para este caso.');
    this.name = 'AlreadyAppealedError';
  }
}

export class InvalidAppealTokenError extends Error {
  constructor() {
    super('El enlace de apelación es inválido o expiró.');
    this.name = 'InvalidAppealTokenError';
  }
}

export class UnexpectedAppealError extends Error {
  constructor() {
    super('Ocurrió un error inesperado. Reintentá en unos segundos.');
    this.name = 'UnexpectedAppealError';
  }
}
