export class EmailAlreadyRegisteredError extends Error {
  constructor() {
    super('Ya existe una cuenta con ese correo');
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export class InvalidRegistrationDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidRegistrationDataError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('No pudimos conectar con el servidor. Reintentá en unos segundos.');
    this.name = 'NetworkError';
  }
}

export class UnexpectedAuthError extends Error {
  constructor() {
    super('Ocurrió un error inesperado. Reintentá en unos segundos.');
    this.name = 'UnexpectedAuthError';
  }
}
