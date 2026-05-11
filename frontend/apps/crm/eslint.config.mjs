import nx from '@nx/eslint-plugin';
import baseConfig from '../../eslint.config.mjs';

export default [
  ...nx.configs['flat/angular'],
  ...nx.configs['flat/angular-template'],
  ...baseConfig,
  {
    files: ['**/*.ts'],
    rules: {
      // The app is a single deployment, not a published lib — strict prefix
      // discipline applies to libs/design-system (enforced there). Here we
      // freely use feature-based names like main-page, applications-grid,
      // dashboard-funnel, login-page, etc.
      '@angular-eslint/directive-selector': 'off',
      '@angular-eslint/component-selector': 'off',
      // Same rationale as design-system: ARIA-shaped input aliases such as
      // `aria-labelledby` and short toggles like `error` are part of the
      // intentional public API.
      '@angular-eslint/no-input-rename': 'off',
    },
  },
  {
    files: ['**/*.html'],
    rules: {},
  },
];
