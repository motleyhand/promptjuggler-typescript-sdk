import {
  type ApiResponse,
  Configuration,
  FetchError,
  KnowledgeBasesApi,
  PromptRunsApi,
  PromptsApi,
  ResponseError,
  StreamingApi,
  WorkflowRunsApi,
} from '../src';
import type {
  CreatePromptRun,
  CreatePromptRunPriorityEnum,
  CreatePromptRunResponse,
  CreateWorkflowRun,
  CreateWorkflowRunPriorityEnum,
  CreateWorkflowRunResponse,
  KnowledgeBaseResponse,
  KnowledgeDocumentResponse,
  PromptRevision,
  PromptRun,
  StreamTokenResponse,
  WorkflowRun,
} from '../src';
import { ApiError, ConnectionError, DecodeError } from './errors';

export interface PromptJugglerOptions {
  /** Override the API base URL. Defaults to `https://promptjuggler.com`. */
  baseUrl?: string;
  /** Custom `fetch` implementation (e.g. for testing or a proxy). Defaults to the global `fetch`. */
  fetch?: typeof fetch;
}

/** Optional parameters for {@link PromptJuggler.runPrompt}. */
export interface RunPromptOptions {
  priority?: CreatePromptRunPriorityEnum;
  thread?: string;
  environment?: string;
  envVars?: Record<string, string>;
  metadata?: Record<string, string | string[]>;
  channel?: string;
}

/** Optional parameters for {@link PromptJuggler.runWorkflow}. */
export interface RunWorkflowOptions {
  priority?: CreateWorkflowRunPriorityEnum;
  thread?: string;
  environment?: string;
  envVars?: Record<string, string>;
  metadata?: Record<string, string | string[]>;
}

/**
 * Ergonomic entry point to the PromptJuggler API. Wraps the generated client: flat
 * method calls in, generated typed models out, with API errors translated into
 * {@link ApiError}.
 */
export class PromptJuggler {
  private readonly prompts: PromptsApi;
  private readonly promptRuns: PromptRunsApi;
  private readonly workflowRuns: WorkflowRunsApi;
  private readonly knowledgeBases: KnowledgeBasesApi;
  private readonly streaming: StreamingApi;

  constructor(apiKey: string, options: PromptJugglerOptions = {}) {
    const config = new Configuration({
      basePath: options.baseUrl,
      accessToken: apiKey,
      fetchApi: options.fetch,
    });
    this.prompts = new PromptsApi(config);
    this.promptRuns = new PromptRunsApi(config);
    this.workflowRuns = new WorkflowRunsApi(config);
    this.knowledgeBases = new KnowledgeBasesApi(config);
    this.streaming = new StreamingApi(config);
  }

  /** Fetch a prompt revision by slug and version (a numeric revision or a tag like `production`). */
  getPrompt(slug: string, version: number | string): Promise<PromptRevision> {
    return this.send(() => this.prompts.getPromptRevisionRaw({ slug, version }));
  }

  /** Trigger a prompt run (async — resolves with the run ID; poll {@link getPromptRun} for the result). */
  runPrompt(
    slug: string,
    version: number | string,
    inputs: Record<string, string>,
    options: RunPromptOptions = {},
  ): Promise<CreatePromptRunResponse> {
    const createPromptRun: CreatePromptRun = {
      inputs,
      priority: options.priority,
      thread: options.thread,
      environment: options.environment,
      envVars: options.envVars,
      metadata: options.metadata,
      channel: options.channel,
    };
    return this.send(() => this.promptRuns.createPromptRunRaw({ slug, version, createPromptRun }));
  }

  /** Fetch a prompt run by ID. */
  getPromptRun(id: string): Promise<PromptRun> {
    return this.send(() => this.promptRuns.getPromptRunRaw({ id }));
  }

  /** Trigger a workflow run (async — resolves with the run ID; poll {@link getWorkflowRun} for the result). */
  runWorkflow(
    slug: string,
    version: number | string,
    inputs: Record<string, string>,
    options: RunWorkflowOptions = {},
  ): Promise<CreateWorkflowRunResponse> {
    const createWorkflowRun: CreateWorkflowRun = {
      inputs,
      priority: options.priority,
      thread: options.thread,
      environment: options.environment,
      envVars: options.envVars,
      metadata: options.metadata,
    };
    return this.send(() => this.workflowRuns.createWorkflowRunRaw({ slug, version, createWorkflowRun }));
  }

  /** Fetch a workflow run by ID. */
  getWorkflowRun(id: string): Promise<WorkflowRun> {
    return this.send(() => this.workflowRuns.getWorkflowRunRaw({ id }));
  }

  /**
   * Mint a short-lived, thread-scoped credential for the streaming endpoint. Call this from your
   * server and hand the result to the browser — the API key must never reach it. The response
   * carries the fully-resolved SSE `url` alongside the token, so clients need no host config.
   *
   * Connect before triggering a run: tokens emitted while nobody is subscribed are not replayed.
   */
  createStreamToken(thread: string): Promise<StreamTokenResponse> {
    return this.send(() => this.streaming.createStreamTokenRaw({ thread }));
  }

  /** Fetch a knowledge base by slug. */
  getKnowledgeBase(slug: string): Promise<KnowledgeBaseResponse> {
    return this.send(() => this.knowledgeBases.publicGetKnowledgeBaseRaw({ slug }));
  }

  /** Fetch a knowledge document by ID. */
  getKnowledgeDocument(id: string): Promise<KnowledgeDocumentResponse> {
    return this.send(() => this.knowledgeBases.publicGetDocumentRaw({ id }));
  }

  /** Delete a knowledge document by ID. */
  deleteKnowledgeDocument(id: string): Promise<void> {
    return this.send(() => this.knowledgeBases.publicDeleteDocumentRaw({ id }));
  }

  /** Upload one or more documents to a knowledge base (processed asynchronously). */
  uploadDocuments(slug: string, files: File[]): Promise<KnowledgeDocumentResponse[]> {
    // The server reads each part's filename (getClientOriginalName) and needs the
    // fields bracket-indexed as files[i] to parse them as an array — the generated
    // client appends bare `files` parts, so we build the body and ride the request
    // builder's initOverrides to swap it in (reusing its URL + auth + parsing).
    const form = new FormData();
    files.forEach((file, index) => {
      form.append(`files[${index}]`, file, file.name);
    });

    return this.send(() => this.knowledgeBases.publicUploadDocumentsRaw({ slug }, { body: form }));
  }

  private async send<T>(call: () => Promise<ApiResponse<T>>): Promise<T> {
    let response: ApiResponse<T>;
    try {
      response = await call();
    } catch (error) {
      // An error status: the server responded, but with a non-2xx code.
      if (error instanceof ResponseError) {
        throw await toApiError(error);
      }
      // No response at all: DNS failure, timeout, aborted, offline, or a custom fetch
      // that threw. The generated client wraps these in FetchError; surface them as an
      // SDK error so callers can catch the whole surface via PromptJugglerError.
      if (error instanceof FetchError) {
        const cause = error.cause;
        const message =
          cause instanceof Error ? cause.message : 'The request failed before a response was received.';
        throw new ConnectionError(message, { cause });
      }
      throw error;
    }

    // A 2xx arrived; value() only reads and maps the body, so anything it throws is a decode failure.
    try {
      return await response.value();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The response body could not be decoded.';
      throw new DecodeError(message, { cause });
    }
  }
}

async function toApiError(error: ResponseError): Promise<ApiError> {
  let message = error.message;
  try {
    const body: unknown = await error.response.json();
    if (body && typeof body === 'object' && 'error' in body && typeof body.error === 'string') {
      message = body.error;
    }
  } catch {
    // Non-JSON error body — keep the generic message.
  }

  return new ApiError(message, error.response.status, { cause: error });
}
