# PromptJuggler TypeScript SDK

The official TypeScript client for the [PromptJuggler](https://promptjuggler.com) API.
Run prompts and workflows, manage knowledge bases, and verify webhooks — fully typed,
with zero runtime dependencies. Works in Node.js and any modern runtime with `fetch`.

## Requirements

- Node.js 22+

## Installation

```bash
npm install @promptjuggler/sdk
```

## Usage

```ts
import { PromptJuggler, RunStatus } from '@promptjuggler/sdk';

const pj = new PromptJuggler('your-api-key');

// Trigger a run (async — returns the run ID)
const created = await pj.runPrompt('greeting', 'production', { name: 'Ada' });

// Poll for the result
const run = await pj.getPromptRun(created.id);
if (run.status === RunStatus.Completed) {
  console.log(run.output);
}
```

Errors surface as `ApiError` (with a `statusCode`). Verify incoming webhooks with
`verifyWebhookSignature()`.

## Documentation

Full guides and the API reference: **https://docs.promptjuggler.com/sdks/typescript/overview**

## License

MIT
