import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  // Vendored Claude Design HTML reference is not source code — lint would
  // flag thousands of issues from the third-party prototype.
  {
    ignores: [
      'preview/**',
      '**/preview/**',
    ],
  },
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}'],
          // Internal Nx-aliased imports — they resolve via tsconfig.base.json
          // paths, not via package.json peer dependencies.
          ignoredDependencies: [],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
  {
    files: ['**/*.ts'],
    rules: {
      // Components use `ds-` kebab-case (ds-button, ds-badge, ds-card, ...).
      '@angular-eslint/component-selector': [
        'error',
        {
          type: ['element', 'attribute'],
          prefix: 'ds',
          style: 'kebab-case',
        },
      ],
      // Attribute directives follow native Angular conventions: camelCase
      // selectors like routerLink / ngModel / dsTooltip / dsMenuTrigger.
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          prefix: 'ds',
          style: 'camelCase',
        },
      ],
      // ARIA-shaped input aliases (`aria-labelledby`, short toggles like
      // `error`) are part of the intentional public API.
      '@angular-eslint/no-input-rename': 'off',
      // Allow ternary expressions used for their side-effects (e.g.
      // `this.isOpen() ? this.close() : this.open();`) and optional-chain
      // calls that the rule otherwise misreads as unused.
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowTernary: true, allowShortCircuit: true, allowTaggedTemplates: true },
      ],
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
];
