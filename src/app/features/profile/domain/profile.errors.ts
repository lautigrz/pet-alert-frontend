export class InvalidProfileDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidProfileDataError';
  }
}

export class UserNotFoundError extends Error {
  constructor() {
    super('Usuario no encontrado');
    this.name = 'UserNotFoundError';
  }
}

export class NetworkError extends Error {
  constructor() {
    super('No pudimos conectarnos con el servidor');
    this.name = 'NetworkError';
  }
}

export class UnexpectedProfileError extends Error {
  constructor() {
    super('Ocurrió un error inesperado');
    this.name = 'UnexpectedProfileError';
  }
}
