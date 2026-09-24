/** Base class for every error the SDK throws. Catch this to handle any SDK failure. */
export class PromptJugglerError extends Error {}

/** Thrown when the API responds with a non-2xx status. */
export class ApiError extends PromptJugglerError {
  constructor(
    message: string,
    readonly statusCode: number | undefined,
    options?: ErrorOptions,
  ) {
    super(message, options);
    this.name = 'ApiError';
  }
}

/** Thrown when the request never reached the API (DNS failure, timeout, aborted, offline). */
export class ConnectionError extends PromptJugglerError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'ConnectionError';
  }
}

/**
 * Thrown when the API replied with a success status but the body didn't decode into the expected
 * model. The request succeeded, so retrying a run starts a second one.
 */
export class DecodeError extends PromptJugglerError {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'DecodeError';
  }
}
