/** Base class for every error the SDK throws. Catch this to handle any SDK failure. */
export class PromptJugglerError extends Error {}

/** Thrown when the API responds with a non-2xx status. */
export class ApiError extends PromptJugglerError {
  constructor(
    message: string,
    readonly statusCode: number | undefined,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
