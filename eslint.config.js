import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // The generated client is excluded — it carries its own eslint-disable banner and is
  // verified by the drift-check, not by our lint rules.
  { ignores: ['src/', 'dist/', 'node_modules/', 'eslint.config.js', 'tsup.config.ts'] },
  js.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Numbers stringify unambiguously — allow them in template literals (e.g. `files[${i}]`).
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
);
