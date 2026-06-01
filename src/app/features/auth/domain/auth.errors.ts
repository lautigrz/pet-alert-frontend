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

export class InvalidCredentialsError extends Error {
  constructor() {
    super('Correo o contraseña incorrectos');
    this.name = 'InvalidCredentialsError';
  }
}

export class RateLimitedError extends Error {
  constructor() {
    super('Demasiados intentos. Esperá unos minutos antes de reintentar.');
    this.name = 'RateLimitedError';
  }
}

export class InvalidLoginDataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidLoginDataError';
  }
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Tu sesión expiró. Ingresá de nuevo.');
    this.name = 'SessionExpiredError';
  }
}

export class InvalidVerificationTokenError extends Error {
  constructor() {
    super('El enlace de verificación es inválido o expiró.');
    this.name = 'InvalidVerificationTokenError';
  }
}