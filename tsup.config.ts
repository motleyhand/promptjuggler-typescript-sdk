import { defineConfig } from 'tsup';

// Bundle the facade + generated client into a single dual-format module (ESM + CJS)
// with type declarations. No runtime deps — node:crypto (webhook verification) is
// externalized as a builtin.
export default defineConfig({
  entry: ['lib/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
  treeshake: true,
});
