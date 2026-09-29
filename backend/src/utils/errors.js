export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class AIProviderError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502, 'AI_PROVIDER_ERROR');
    this.originalMessage = originalError?.message;
  }
}

export class AISchemaValidationError extends AppError {
  constructor(message, rawOutput = null) {
    super(message, 502, 'AI_SCHEMA_VALIDATION_ERROR');
    this.rawOutput = rawOutput;
  }
}

export class SearchProviderError extends AppError {
  constructor(message, originalError = null) {
    super(message, 502, 'SEARCH_PROVIDER_ERROR');
    this.originalMessage = originalError?.message;
  }
}

export class CitationValidationError extends AppError {
  constructor(message, invalidCitations = []) {
    super(message, 422, 'CITATION_VALIDATION_ERROR');
    this.invalidCitations = invalidCitations;
  }
}
